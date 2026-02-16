import { requestUrl, RequestUrlParam } from 'obsidian';
import { ElevenLabsConfig, VoiceSettings } from '../../types/elevenlabs';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';
const MAX_CHARS_PER_REQUEST = 4500;

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

    // Split long text into chunks to avoid ElevenLabs character limit
    if (text.length > MAX_CHARS_PER_REQUEST) {
      const chunks = this.splitTextIntoChunks(text, MAX_CHARS_PER_REQUEST);
      const audioBuffers: ArrayBuffer[] = [];

      for (const chunk of chunks) {
        const buffer = await this.requestTTS(chunk, settings);
        audioBuffers.push(buffer);
      }

      return this.concatenateAudioBuffers(audioBuffers);
    }

    return this.requestTTS(text, settings);
  }

  private async requestTTS(text: string, settings: VoiceSettings): Promise<ArrayBuffer> {
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

  private splitTextIntoChunks(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?。\n])\s*/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        // If a single sentence is longer than maxLength, split it further
        if (sentence.length > maxLength) {
          const words = sentence.split(/\s+/);
          for (const word of words) {
            if (currentChunk.length + word.length + 1 > maxLength) {
              if (currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
              }
            }
            currentChunk += (currentChunk ? ' ' : '') + word;
          }
        } else {
          currentChunk = sentence;
        }
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private concatenateAudioBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
    const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const buffer of buffers) {
      result.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }

    return result.buffer;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const params: RequestUrlParam = {
        url: `${ELEVENLABS_API_BASE}/models`,
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
