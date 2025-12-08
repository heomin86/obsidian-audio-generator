export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  model: string;
  outputFormat?: string;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}
