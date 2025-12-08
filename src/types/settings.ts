export type AIProvider = 'xai' | 'openai' | 'anthropic' | 'gemini';

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  enabled: boolean;
}

export interface AISettings {
  activeProvider: AIProvider;
  providers: Record<AIProvider, AIProviderConfig>;
}

export interface ElevenLabsSettings {
  apiKey: string;
  voiceId: string;
  model: string;
  outputFormat: string;
}

export interface AudioGeneratorSettings {
  ai: AISettings;
  elevenlabs: ElevenLabsSettings;
  enableSummarization: boolean;
  summarizationThreshold: number;
}

export const DEFAULT_SETTINGS: AudioGeneratorSettings = {
  ai: {
    activeProvider: 'xai',
    providers: {
      xai: {
        apiKey: '',
        model: 'grok-4-1-fast-reasoning',
        enabled: true
      },
      openai: {
        apiKey: '',
        model: 'gpt-4o-mini',
        enabled: false
      },
      anthropic: {
        apiKey: '',
        model: 'claude-sonnet-4',
        enabled: false
      },
      gemini: {
        apiKey: '',
        model: 'gemini-2.5-flash',
        enabled: false
      }
    }
  },
  elevenlabs: {
    apiKey: '',
    voiceId: '4JJwo477JUAx3HV0T7n7',
    model: 'eleven_turbo_v2_5',
    outputFormat: 'mp3_44100_192'
  },
  enableSummarization: true,
  summarizationThreshold: 2000
};

export interface ProviderMetadata {
  id: AIProvider;
  label: string;
  description: string;
  defaultModel: string;
  models: string[];
  docsUrl: string;
  placeholderKey: string;
}

export const PROVIDER_METADATA: ProviderMetadata[] = [
  {
    id: 'xai',
    label: 'xAI (Grok)',
    description: 'Fast reasoning with Grok models',
    defaultModel: 'grok-4-1-fast-reasoning',
    models: ['grok-4-1-fast-reasoning', 'grok-4-1-fast', 'grok-3-mini-fast-reasoning'],
    docsUrl: 'https://console.x.ai',
    placeholderKey: 'xai-...'
  },
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'GPT-4o and GPT-4o-mini models',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    docsUrl: 'https://platform.openai.com/api-keys',
    placeholderKey: 'sk-...'
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    description: 'Claude Sonnet and other models',
    defaultModel: 'claude-sonnet-4',
    models: ['claude-sonnet-4', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    docsUrl: 'https://console.anthropic.com/settings/keys',
    placeholderKey: 'sk-ant-...'
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    description: 'Gemini Flash and Pro models',
    defaultModel: 'gemini-2.5-flash',
    models: ['gemini-2.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-pro'],
    docsUrl: 'https://aistudio.google.com/app/apikey',
    placeholderKey: 'AIza...'
  }
];
