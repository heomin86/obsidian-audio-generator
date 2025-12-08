import { AIClient } from '../../types/ai';
import { requestUrl, RequestUrlParam } from 'obsidian';

const OPENAI_API_BASE = 'https://api.openai.com/v1';

export class OpenAIProvider implements AIClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model || 'gpt-4o-mini';
  }

  async generateText(userPrompt: string, systemPrompt: string, temperature = 0.3): Promise<string> {
    const params: RequestUrlParam = {
      url: `${OPENAI_API_BASE}/chat/completions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: 2048,
      }),
    };

    const response = await requestUrl(params);

    if (response.status !== 200) {
      throw new Error(`OpenAI API Error: ${response.status} - ${response.text}`);
    }

    const data = response.json;
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI API');
    }

    return data.choices[0].message.content;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const params: RequestUrlParam = {
        url: `${OPENAI_API_BASE}/models`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      };
      const response = await requestUrl(params);
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
