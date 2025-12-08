import { requestUrl, RequestUrlParam } from 'obsidian';
import { ElevenLabsConfig, VoiceSettings } from '../../types/elevenlabs';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

export class ElevenLabsService {
  private apiKey: string;
  private voiceId: string;
  private model: string;
  private outputFormat: string;

  constructor(config: ElevenLabsConfig) {
    this.apiKey = config.apiKey;
    this.voiceId = config.voiceId || '4JJwo477JUAx3HV0T7n7';
    this.model = config.model || 'eleven_turbo_v2_5';
    this.outputFormat = config.outputFormat || 'mp3_44100_192';
  }

  async textToSpeech(text: string, voiceSettings?: VoiceSettings): Promise<ArrayBuffer> {
    const defaultSettings: VoiceSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0,
      use_speaker_boost: true,
    };

    const settings = voiceSettings || defaultSettings;

    const params: RequestUrlParam = {
      url: `${ELEVENLABS_API_BASE}/text-to-speech/${this.voiceId}?output_format=${this.outputFormat}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: this.model,
        voice_settings: settings,
      }),
    };

    const response = await requestUrl(params);

    if (response.status !== 200) {
      const errorText = response.text || 'Unknown error';
      throw new Error(`ElevenLabs API Error: ${response.status} - ${errorText}`);
    }

    return response.arrayBuffer;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const params: RequestUrlParam = {
        url: `${ELEVENLABS_API_BASE}/user`,
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
        },
      };
      const response = await requestUrl(params);
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async getVoices(): Promise<Array<{ voice_id: string; name: string }>> {
    const params: RequestUrlParam = {
      url: `${ELEVENLABS_API_BASE}/voices`,
      method: 'GET',
      headers: {
        'xi-api-key': this.apiKey,
      },
    };

    const response = await requestUrl(params);

    if (response.status !== 200) {
      throw new Error(`Failed to fetch voices: ${response.status}`);
    }

    const data = response.json;
    return data.voices || [];
  }
}
