#include <napi.h>
#include <portaudio.h>
#include <memory>
#include <map>
#include <atomic>
#include <stdexcept>

// ThreadSafeFunction for async callback
static std::unique_ptr<Napi::ThreadSafeFunction> g_audioCallbackTsfn;

// ThreadSafeFunction for event callback
static std::unique_ptr<Napi::ThreadSafeFunction> g_eventCallbackTsfn;

// --- Stream state ---
struct StreamInfo
{
  PaStream *stream;
  float volume;
};
static std::map<uint32_t, StreamInfo> g_streams;
static std::atomic<uint32_t> g_nextStreamId{1};

// Helper to get stream info by ID
StreamInfo *GetStreamInfoById(uint32_t id)
{
  auto it = g_streams.find(id);
  return it != g_streams.end() ? &it->second : nullptr;
}

// Initialize PortAudio
Napi::Value Init(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  PaError err = Pa_Initialize();
  if (err != paNoError)
  {
    Napi::Error::New(env, Pa_GetErrorText(err)).ThrowAsJavaScriptException();
    return env.Null();
  }
  return env.Undefined();
}

// Terminate PortAudio and close all streams
Napi::Value Terminate(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  // Close all open streams
  for (auto &kv : g_streams)
  {
    PaStream *stream = kv.second.stream;
    if (stream)
    {
      Pa_StopStream(stream);
      Pa_CloseStream(stream);
    }
  }
  g_streams.clear();
  if (g_audioCallbackTsfn)
  {
    g_audioCallbackTsfn->Release();
    g_audioCallbackTsfn.reset();
  }
  if (g_eventCallbackTsfn)
  {
    g_eventCallbackTsfn->Release();
    g_eventCallbackTsfn.reset();
  }
  PaError err = Pa_Terminate();
  if (err != paNoError)
  {
    Napi::Error::New(env, Pa_GetErrorText(err)).ThrowAsJavaScriptException();
    return env.Null();
  }
  return env.Undefined();
}

// Get PortAudio version string
Napi::Value GetVersion(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  const char *version = Pa_GetVersionText();
  return Napi::String::New(env, version);
}

// Enumerate PortAudio devices
Napi::Value GetDevices(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  int numDevices = Pa_GetDeviceCount();
  if (numDevices < 0)
  {
    Napi::Error::New(env, Pa_GetErrorText(numDevices)).ThrowAsJavaScriptException();
    return env.Null();
  }
  Napi::Array devices = Napi::Array::New(env, numDevices);
  for (int i = 0; i < numDevices; ++i)
  {
    const PaDeviceInfo *deviceInfo = Pa_GetDeviceInfo(i);
    if (!deviceInfo)
      continue;
    Napi::Object dev = Napi::Object::New(env);
    dev.Set("index", i);
    dev.Set("name", deviceInfo->name ? deviceInfo->name : "");
    dev.Set("maxInputChannels", deviceInfo->maxInputChannels);
    dev.Set("maxOutputChannels", deviceInfo->maxOutputChannels);
    dev.Set("defaultSampleRate", deviceInfo->defaultSampleRate);
    dev.Set("hostApi", deviceInfo->hostApi);
    dev.Set("defaultLowInputLatency", deviceInfo->defaultLowInputLatency);
    dev.Set("defaultLowOutputLatency", deviceInfo->defaultLowOutputLatency);
    dev.Set("defaultHighInputLatency", deviceInfo->defaultHighInputLatency);
    dev.Set("defaultHighOutputLatency", deviceInfo->defaultHighOutputLatency);
    devices.Set(i, dev);
  }
  return devices;
}

// Open default output stream (stereo, 44.1kHz, float32)
Napi::Value OpenDefaultStream(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  PaStream *stream = nullptr;
  if (g_streams.size() > 0)
  {
    Napi::Error::New(env, "Stream already open").ThrowAsJavaScriptException();
    return env.Null();
  }
  PaError err = Pa_OpenDefaultStream(
      &stream,
      0, // no input
      2, // stereo output
      paFloat32,
      44100,
      256,     // frames per buffer
      nullptr, // no callback (blocking API)
      nullptr);
  if (err != paNoError)
  {
    Napi::Error::New(env, Pa_GetErrorText(err)).ThrowAsJavaScriptException();
    return env.Null();
  }
  err = Pa_StartStream(stream);
  if (err != paNoError)
  {
    Napi::Error::New(env, Pa_GetErrorText(err)).ThrowAsJavaScriptException();
    Pa_CloseStream(stream);
    return env.Null();
  }
  uint32_t streamId = g_nextStreamId++;
  g_streams[streamId] = {stream, 1.0f};
  return Napi::Number::New(env, streamId);
}

// Open stream with custom parameters (returns stream ID)
Napi::Value OpenStream(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  try
  {
    // Validate arguments (device index, sample rate, channels, etc.)
    if (info.Length() < 4 || !info[0].IsNumber() || !info[1].IsNumber() || !info[2].IsNumber() || !info[3].IsNumber())
    {
      Napi::TypeError::New(env, "Expected device index, sample rate, channels, and framesPerBuffer").ThrowAsJavaScriptException();
      return env.Null();
    }
    int deviceIndex = info[0].As<Napi::Number>().Int32Value();
    double sampleRate = info[1].As<Napi::Number>().DoubleValue();
    int channels = info[2].As<Napi::Number>().Int32Value();
    unsigned long framesPerBuffer = info[3].As<Napi::Number>().Uint32Value();

    // Defensive: check device index
    int numDevices = Pa_GetDeviceCount();
    if (deviceIndex < 0 || deviceIndex >= numDevices)
    {
      std::string msg = "Invalid device index: " + std::to_string(deviceIndex) + ". Available devices: 0-" + std::to_string(numDevices - 1);
      Napi::Error::New(env, msg).ThrowAsJavaScriptException();
      return env.Null();
    }
    if (channels <= 0)
    {
      Napi::Error::New(env, "Channel count must be positive").ThrowAsJavaScriptException();
      return env.Null();
    }
    if (sampleRate <= 0)
    {
      Napi::Error::New(env, "Sample rate must be positive").ThrowAsJavaScriptException();
      return env.Null();
    }
    if (framesPerBuffer == 0)
    {
      Napi::Error::New(env, "framesPerBuffer must be positive").ThrowAsJavaScriptException();
      return env.Null();
    }

    PaStreamParameters outputParams;
    outputParams.device = deviceIndex;
    outputParams.channelCount = channels;
    outputParams.sampleFormat = paFloat32;
    outputParams.suggestedLatency = Pa_GetDeviceInfo(deviceIndex)->defaultLowOutputLatency;
    outputParams.hostApiSpecificStreamInfo = nullptr;

    PaStream *stream = nullptr;
    PaError err = Pa_OpenStream(
        &stream,
        nullptr,       // input
        &outputParams, // output
        sampleRate,
        framesPerBuffer,
        paNoFlag,
        nullptr, // no callback (blocking)
        nullptr);
    if (err != paNoError)
    {
      std::string msg = std::string("PortAudio error in Pa_OpenStream: ") + Pa_GetErrorText(err);
      Napi::Error::New(env, msg).ThrowAsJavaScriptException();
      return env.Null();
    }
    err = Pa_StartStream(stream);
    if (err != paNoError)
    {
      Pa_CloseStream(stream);
      std::string msg = std::string("PortAudio error in Pa_StartStream: ") + Pa_GetErrorText(err);
      Napi::Error::New(env, msg).ThrowAsJavaScriptException();
      return env.Null();
    }
    uint32_t streamId = g_nextStreamId++;
    g_streams[streamId] = {stream, 1.0f};
    return Napi::Number::New(env, streamId);
  }
  catch (const std::exception &ex)
  {
    Napi::Error::New(env, ex.what()).ThrowAsJavaScriptException();
    return env.Null();
  }
}

// Write buffer to stream (expects Float32Array or Buffer of float32, plus stream ID)
Napi::Value WriteStream(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  try
  {
    if (info.Length() < 2 || !info[1].IsNumber())
    {
      Napi::TypeError::New(env, "Expected buffer and stream ID").ThrowAsJavaScriptException();
      return env.Null();
    }
    uint32_t streamId = info[1].As<Napi::Number>().Uint32Value();
    StreamInfo *sinfo = GetStreamInfoById(streamId);
    if (!sinfo)
    {
      throw std::runtime_error("Stream not open");
    }
    PaStream *stream = sinfo->stream;
    float *data = nullptr;
    size_t len = 0;
    if (info[0].IsBuffer())
    {
      Napi::Buffer<float> buf = info[0].As<Napi::Buffer<float>>();
      data = buf.Data();
      len = buf.Length();
    }
    else if (info[0].IsTypedArray())
    {
      Napi::TypedArray arr = info[0].As<Napi::TypedArray>();
      if (arr.TypedArrayType() != napi_float32_array)
      {
        Napi::TypeError::New(env, "Expected Float32Array").ThrowAsJavaScriptException();
        return env.Null();
      }
      Napi::TypedArrayOf<float> f32arr = info[0].As<Napi::TypedArrayOf<float>>();
      data = f32arr.Data();
      len = f32arr.ElementLength();
    }
    else
    {
      Napi::TypeError::New(env, "Expected Buffer or Float32Array").ThrowAsJavaScriptException();
      return env.Null();
    }
    if (!data || len == 0)
    {
      throw std::runtime_error("Empty buffer");
    }
    // Apply volume scaling
    float volume = sinfo->volume;
    if (volume != 1.0f)
    {
      for (size_t i = 0; i < len; ++i)
      {
        data[i] *= volume;
      }
    }
    PaError err = Pa_WriteStream(stream, data, len / 2); // stereo
    if (err != paNoError)
    {
      throw std::runtime_error(Pa_GetErrorText(err));
    }
    return env.Undefined();
  }
  catch (const std::exception &ex)
  {
    Napi::Error::New(env, ex.what()).ThrowAsJavaScriptException();
    return env.Null();
  }
}

// Close the output stream (by stream ID)
Napi::Value CloseStream(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsNumber())
    return env.Undefined();
  uint32_t streamId = info[0].As<Napi::Number>().Uint32Value();
  StreamInfo *sinfo = GetStreamInfoById(streamId);
  if (!sinfo)
    return env.Undefined();
  PaStream *stream = sinfo->stream;
  PaError err = Pa_StopStream(stream);
  if (err == paNoError)
    err = Pa_CloseStream(stream);
  g_streams.erase(streamId);
  if (g_audioCallbackTsfn)
  {
    g_audioCallbackTsfn->Release();
    g_audioCallbackTsfn.reset();
  }
  if (g_eventCallbackTsfn)
  {
    g_eventCallbackTsfn->Release();
    g_eventCallbackTsfn.reset();
  }
  if (err != paNoError)
  {
    Napi::Error::New(env, Pa_GetErrorText(err)).ThrowAsJavaScriptException();
    return env.Null();
  }
  return env.Undefined();
}

// Helper to emit event from PortAudio callback
void EmitStreamEvent(const std::string &type, const std::string &message = "")
{
  if (g_eventCallbackTsfn)
  {
    g_eventCallbackTsfn->BlockingCall([type, message](Napi::Env env, Napi::Function jsCallback)
                                      {
      Napi::Object evt = Napi::Object::New(env);
      evt.Set("type", type);
      evt.Set("message", message);
      jsCallback.Call({evt}); });
  }
}

// Modified PortAudio stream callback for async playback with event reporting
static int AudioCallback(const void *input, void *output,
                         unsigned long frameCount,
                         const PaStreamCallbackTimeInfo *timeInfo,
                         PaStreamCallbackFlags statusFlags,
                         void *userData)
{
  auto *tsfn = static_cast<Napi::ThreadSafeFunction *>(userData);
  float *out = static_cast<float *>(output);
  // Call JS callback to fill output buffer
  napi_status status = tsfn->BlockingCall([out, frameCount](Napi::Env env, Napi::Function jsCallback)
                                          {
    Napi::Buffer<float> buf = Napi::Buffer<float>::New(env, out, frameCount * 2); // stereo
    jsCallback.Call({buf}); });
  // Report underflow/overflow events
  if (statusFlags & paOutputUnderflow)
    EmitStreamEvent("outputUnderflow");
  if (statusFlags & paOutputOverflow)
    EmitStreamEvent("outputOverflow");
  if (statusFlags & paPrimingOutput)
    EmitStreamEvent("primingOutput");
  return status == napi_ok ? paContinue : paAbort;
}

// Set JS callback for stream events/errors
Napi::Value SetStreamEventCallback(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  if (!info[0].IsFunction())
  {
    Napi::TypeError::New(env, "Expected callback function").ThrowAsJavaScriptException();
    return env.Null();
  }
  Napi::Function jsCallback = info[0].As<Napi::Function>();
  if (g_eventCallbackTsfn)
  {
    g_eventCallbackTsfn->Release();
    g_eventCallbackTsfn.reset();
  }
  g_eventCallbackTsfn = std::make_unique<Napi::ThreadSafeFunction>(
      Napi::ThreadSafeFunction::New(env, jsCallback, "StreamEventCallback", 0, 1));
  return env.Undefined();
}

// Open async stream with JS callback
Napi::Value OpenStreamAsync(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  if (g_streams.size() > 0)
  {
    Napi::Error::New(env, "Stream already open").ThrowAsJavaScriptException();
    return env.Null();
  }
  if (!info[0].IsObject() || !info[1].IsFunction())
  {
    Napi::TypeError::New(env, "Expected options object and callback").ThrowAsJavaScriptException();
    return env.Null();
  }
  Napi::Object opts = info[0].As<Napi::Object>();
  Napi::Function jsCallback = info[1].As<Napi::Function>();
  int device = opts.Has("device") ? opts.Get("device").As<Napi::Number>().Int32Value() : Pa_GetDefaultOutputDevice();
  int channels = opts.Has("channels") ? opts.Get("channels").As<Napi::Number>().Int32Value() : 2;
  double sampleRate = opts.Has("sampleRate") ? opts.Get("sampleRate").As<Napi::Number>().DoubleValue() : 44100.0;
  unsigned long framesPerBuffer = opts.Has("framesPerBuffer") ? opts.Get("framesPerBuffer").As<Napi::Number>().Uint32Value() : 256;
  double latency = opts.Has("suggestedLatency") ? opts.Get("suggestedLatency").As<Napi::Number>().DoubleValue() : 0.0;

  PaStreamParameters outputParams;
  outputParams.device = device;
  outputParams.channelCount = channels;
  outputParams.sampleFormat = paFloat32;
  if (latency > 0.0)
  {
    outputParams.suggestedLatency = latency;
  }
  else
  {
    const PaDeviceInfo *devInfo = Pa_GetDeviceInfo(device);
    outputParams.suggestedLatency = devInfo ? devInfo->defaultLowOutputLatency : 0.05;
  }
  outputParams.hostApiSpecificStreamInfo = nullptr;

  // Create ThreadSafeFunction for JS callback
  g_audioCallbackTsfn = std::make_unique<Napi::ThreadSafeFunction>(
      Napi::ThreadSafeFunction::New(env, jsCallback, "AudioCallback", 0, 1));

  PaStream *stream = nullptr;
  PaError err = Pa_OpenStream(
      &stream,
      nullptr, // input
      &outputParams,
      sampleRate,
      framesPerBuffer,
      paNoFlag,
      AudioCallback,
      g_audioCallbackTsfn.get());
  if (err != paNoError)
  {
    g_audioCallbackTsfn->Release();
    g_audioCallbackTsfn.reset();
    Napi::Error::New(env, Pa_GetErrorText(err)).ThrowAsJavaScriptException();
    return env.Null();
  }
  err = Pa_StartStream(stream);
  if (err != paNoError)
  {
    Pa_CloseStream(stream);
    g_audioCallbackTsfn->Release();
    g_audioCallbackTsfn.reset();
    Napi::Error::New(env, Pa_GetErrorText(err)).ThrowAsJavaScriptException();
    return env.Null();
  }
  uint32_t streamId = g_nextStreamId++;
  g_streams[streamId] = {stream, 1.0f};
  return Napi::Number::New(env, streamId);
}

// Check if output format is supported for a device (float32, output only)
Napi::Value IsOutputFormatSupported(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  if (info.Length() < 3 || !info[0].IsNumber() || !info[1].IsNumber() || !info[2].IsNumber())
  {
    Napi::TypeError::New(env, "Expected device index, sample rate, channels").ThrowAsJavaScriptException();
    return env.Null();
  }
  int deviceIndex = info[0].As<Napi::Number>().Int32Value();
  double sampleRate = info[1].As<Napi::Number>().DoubleValue();
  int channels = info[2].As<Napi::Number>().Int32Value();

  PaStreamParameters outputParams;
  outputParams.device = deviceIndex;
  outputParams.channelCount = channels;
  outputParams.sampleFormat = paFloat32;
  const PaDeviceInfo *devInfo = Pa_GetDeviceInfo(deviceIndex);
  outputParams.suggestedLatency = devInfo ? devInfo->defaultLowOutputLatency : 0.05;
  outputParams.hostApiSpecificStreamInfo = nullptr;

  PaError err = Pa_IsFormatSupported(nullptr, &outputParams, sampleRate);
  return Napi::Boolean::New(env, err == paNoError);
}

// Set stream volume
Napi::Value SetStreamVolume(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber())
  {
    Napi::TypeError::New(env, "Expected stream ID and volume").ThrowAsJavaScriptException();
    return env.Null();
  }
  uint32_t streamId = info[0].As<Napi::Number>().Uint32Value();
  float volume = info[1].As<Napi::Number>().FloatValue();
  if (volume < 0.0f)
    volume = 0.0f;
  if (volume > 2.0f)
    volume = 2.0f;
  StreamInfo *sinfo = GetStreamInfoById(streamId);
  if (!sinfo)
  {
    Napi::Error::New(env, "Stream not open").ThrowAsJavaScriptException();
    return env.Null();
  }
  sinfo->volume = volume;
  return env.Undefined();
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports)
{
  exports.Set(Napi::String::New(env, "init"), Napi::Function::New(env, Init));
  exports.Set(Napi::String::New(env, "terminate"), Napi::Function::New(env, Terminate));
  exports.Set(Napi::String::New(env, "getVersion"), Napi::Function::New(env, GetVersion));
  exports.Set(Napi::String::New(env, "getDevices"), Napi::Function::New(env, GetDevices));
  exports.Set(Napi::String::New(env, "openDefaultStream"), Napi::Function::New(env, OpenDefaultStream));
  exports.Set(Napi::String::New(env, "openStream"), Napi::Function::New(env, OpenStream));
  exports.Set(Napi::String::New(env, "writeStream"), Napi::Function::New(env, WriteStream));
  exports.Set(Napi::String::New(env, "closeStream"), Napi::Function::New(env, CloseStream));
  exports.Set(Napi::String::New(env, "openStreamAsync"), Napi::Function::New(env, OpenStreamAsync));
  exports.Set(Napi::String::New(env, "setStreamEventCallback"), Napi::Function::New(env, SetStreamEventCallback));
  exports.Set(Napi::String::New(env, "setStreamVolume"), Napi::Function::New(env, SetStreamVolume));
  exports.Set(Napi::String::New(env, "isOutputFormatSupported"), Napi::Function::New(env, IsOutputFormatSupported));
  return exports;
}

NODE_API_MODULE(portaudio, InitAll)
