import { AIProvider, AIRequestParams, AIClient } from '../../types/ai';
import { XAIProvider } from './xai-provider';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { GeminiProvider } from './gemini-provider';

export function createAIClient(params: AIRequestParams): AIClient {
  switch (params.provider) {
    case 'xai':
      return new XAIProvider(params.apiKey, params.model);
    case 'openai':
      return new OpenAIProvider(params.apiKey, params.model);
    case 'anthropic':
      return new AnthropicProvider(params.apiKey, params.model);
    case 'gemini':
      return new GeminiProvider(params.apiKey, params.model);
    default:
      throw new Error(`Unknown AI provider: ${params.provider}`);
  }
}
