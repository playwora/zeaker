// Type definitions for Zeaker
// Project: https://github.com/playwora/zeaker
// Definitions by: zevinDev

export interface DeviceInfo {
  index: number;
  name: string;
  hostAPI: string;
  maxInputChannels: number;
  maxOutputChannels: number;
  defaultSampleRate: number;
  [key: string]: any;
}

export type RepeatMode = "off" | "one" | "all";

export interface PlaylistStatus {
  currentIndex: number;
  tracks: string[];
  repeatMode: RepeatMode;
  shuffle: boolean;
  isActive: boolean;
}

export interface AudioPlayerStatus {
  isPlaying: boolean;
  isPaused: boolean;
  currentTrack: string | null;
  volume: number;
  bufferSize: number | null;
  playlist: PlaylistStatus;
  effects: any;
  device: DeviceInfo | null;
  streaming: boolean;
}

export interface AudioMetadata {
  [key: string]: any;
  duration?: number | null;
}

export class AudioPlayer {
  constructor(options?: object);
  play(filePath: string, startPosition?: number): Promise<void>;
  playPlaylist(playlist: string[]): Promise<void>;
  playGapless(nextTrack: string): Promise<void>;
  crossfadeTo(nextTrack: string, duration?: number): Promise<void>;
  playStream(url: string, options?: object): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  seek(positionSeconds: number): Promise<void>;
  setVolume(level: number): Promise<void>;
  getVolume(): number;
  setOutputDevice(deviceIndex: number): Promise<void>;
  setBitPerfect(options?: boolean | object): Promise<void>;
  setBufferSize(frames: number): void;
  setCrossfadeDuration(duration: number): void;
  setCrossfadeCurve(curve: string): void;
  getMetadata(): Promise<AudioMetadata>;
  getManagers(): {
    device: DeviceManager;
    playlist: PlaylistManager;
    effects: AudioEffects;
    stream: StreamManager;
  };
  getStatus(): AudioPlayerStatus;
  getCurrentTime(): number;
  /**
   * Get current track duration in seconds, or null if unknown.
   */
  getDuration(): number | null;
  onVisualization(callback: (pcm: Buffer | Float32Array) => void): void;
  stopPlaylist(): void;
  setPlaylistShuffle(enable?: boolean): void;
  setPlaylistRepeat(mode?: RepeatMode): void;
  static listOutputDevices(): Promise<DeviceInfo[]>;
  // Event signatures
  on(event: "play", handler: (track: string) => void): void;
  on(event: "pause", handler: (track: string | null) => void): void;
  on(event: "resume", handler: (track: string | null) => void): void;
  on(event: "stop", handler: (track: string | null) => void): void;
  on(event: "trackEnd", handler: (track: string) => void): void;
  on(event: "playlistEnd", handler: (playlist: string[]) => void): void;
  on(event: "error", handler: (error: Error) => void): void;
  on(event: "currentTime", handler: (currentTime: number) => void): void;
  on(event: "duration", handler: (duration: number) => void): void;
  on(event: "deviceError", handler: (error: Error) => void): void;
  on(event: "streamError", handler: (error: Error) => void): void;
  on(event: "streamReconnect", handler: (info: any) => void): void;
  on(event: "streamBuffering", handler: (isBuffering: boolean) => void): void;
  on(event: "bitPerfectChange", handler: (config: any) => void): void;
  on(event: "volumeChange", handler: (level: number) => void): void;
  on(event: "crossfadeConfigChange", handler: (config: any) => void): void;
  on(
    event: "deviceChange",
    handler: (info: { index: number; name: string; info: DeviceInfo }) => void
  ): void;
  on(
    event: "resampleInfo",
    handler: (info: {
      sampleRate: number;
      bitDepth: number;
      channels: number;
    }) => void
  ): void;
}

export class DeviceManager {
  listOutputDevices(): Promise<DeviceInfo[]>;
  getCurrentDevice(): DeviceInfo | null;
  getDefaultDevice(): Promise<DeviceInfo>;
  setOutputDevice(
    index: number
  ): Promise<{ changed: boolean; device: DeviceInfo }>;
  getPortAudio(): Promise<any>;
}

export class PlaylistManager {
  loadPlaylist(playlist: string[]): void;
  getCurrentTrack(): string | null;
  getPlaylistStatus(): PlaylistStatus;
  getPlaylistCopy(): string[];
  isPlaylistActive(): boolean;
  navigateNext(): { hasNext: boolean; track: string };
  navigatePrevious(): { hasPrevious: boolean; track: string };
  stopPlaylist(): void;
  setPlaylistShuffle(enable: boolean): void;
  setPlaylistRepeat(mode: RepeatMode): void;
}

export class AudioEffects {
  isBitPerfectMode(): boolean;
  setBitPerfect(options?: boolean | object): any;
  validateEffectAvailability(effect: string): void;
  setCrossfadeDuration(duration: number): void;
  setCrossfadeCurve(curve: string): void;
  getCrossfadeConfig(): any;
  getConfiguration(): any;
  prebufferNextTrack(
    nextTrack: string,
    ffmpegPath: string,
    opts: object
  ): Promise<any>;
  waitForGaplessReady(timeout: number): Promise<boolean>;
  getGaplessBuffers(): Float32Array[] | null;
  cleanupGapless(): void;
}

export class StreamManager {
  playStream(url: string, options?: object): Promise<void>;
  isStreaming(): boolean;
  cleanup(): void;
}

export namespace AudioUtils {
  function negotiateAudioFormat(
    trackInfo: any,
    deviceInfo: any,
    portaudio: any
  ): any;
  function scalePCMVolume(
    buffer: Buffer | Float32Array,
    volume: number
  ): Float32Array;
  function mixCrossfade(
    currentBuffers: Buffer[],
    nextBuffers: Buffer[],
    crossfadeFrames: number,
    channels: number,
    curve?: string
  ): Buffer[];
  function shuffleArray<T>(arr: T[]): T[];
  function validateCrossfadeCurve(curve: string): string;
  function durationToFrames(
    durationSeconds: number,
    sampleRate: number
  ): number;
  function getFrameSize(channels: number, format?: string): number;
}

export namespace ErrorHandler {
  function handleError(error: Error, context?: string, player?: any): void;
  function validateParams(params: object): void;
}

export namespace FFmpegUtils {
  function locateFFmpeg(): Promise<string>;
  function extractMetadata(
    filePath: string,
    ffmpegPath: string
  ): Promise<object>;
  function getAudioInfo(filePath: string): Promise<object>;
  function buildFFmpegArgs(opts: object): string[];
  function createFFmpegProcess(ffmpegPath: string, args: string[]): any;
  function killFFmpegProcess(proc: any): void;
}

export namespace ffprobeUtil {
  function getMetadata(filePath: string): Promise<object>;
}
