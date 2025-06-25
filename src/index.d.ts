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
}

export interface AudioPlayerOptions {
  deviceIndex?: number;
  bitPerfect?: boolean;
  volume?: number;
  [key: string]: any;
}

export type RepeatMode = "off" | "one" | "all";

export class AudioPlayer {
  constructor(options?: AudioPlayerOptions);
  play(filePath: string): Promise<void>;
  playPlaylist(playlist: string[]): Promise<void>;
  playGapless(nextTrack: string): Promise<void>;
  crossfadeTo(nextTrack: string, duration: number): Promise<void>;
  playStream(url: string): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  seek(seconds: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  setOutputDevice(deviceIndex: number): Promise<void>;
  getMetadata(): Promise<{
    title?: string;
    artist?: string;
    album?: string;
    duration?: number;
    [key: string]: any;
  }>;
  getManagers(): {
    effects: AudioEffects;
    playlist: PlaylistManager;
    device: DeviceManager;
    stream: StreamManager;
  };
  on(event: "play", handler: (track: object) => void): void;
  on(event: "pause" | "resume" | "stop", handler: () => void): void;
  on(event: "error", handler: (error: Error) => void): void;
  static listOutputDevices(): Promise<DeviceInfo[]>;
}

export class DeviceManager {
  listOutputDevices(): Promise<DeviceInfo[]>;
  setOutputDevice(index: number): Promise<void>;
}

export class PlaylistManager {
  playPlaylist(playlist: string[]): Promise<void>;
  shuffle(): void;
  repeat(mode: RepeatMode): void;
  next(): Promise<void>;
  previous(): Promise<void>;
}

export class AudioEffects {
  setBitPerfect(enabled: boolean): void;
  setCrossfadeDuration(seconds: number): void;
}

export class StreamManager {
  playStream(url: string): Promise<void>;
}

export namespace AudioUtils {
  function getDuration(filePath: string): Promise<number>;
}

export namespace ErrorHandler {
  function handleError(error: Error): void;
}

export namespace FFmpegUtils {
  function probeFormat(filePath: string): Promise<object>;
}

export namespace ffprobeUtil {
  function getMetadata(filePath: string): Promise<object>;
}
