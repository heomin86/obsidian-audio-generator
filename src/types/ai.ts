export type AIProvider = 'xai' | 'openai' | 'anthropic' | 'gemini';

export interface AIRequestParams {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

export interface AIClient {
  generateText(userPrompt: string, systemPrompt: string, temperature?: number): Promise<string>;
  validateApiKey(): Promise<boolean>;
}
