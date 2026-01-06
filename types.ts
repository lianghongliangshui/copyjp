export interface SubtitleItem {
  id: number;
  start: number; // seconds
  end: number;   // seconds
  text: string;
}

export interface AudioState {
  isReady: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number; // 0-100 (download/decode progress)
  statusMessage: string;
  duration: number;
  currentTime: number;
  volume: number;
}

export interface PlaybackRequest {
  start: number;
  end: number;
}
