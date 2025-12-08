import { AIClient } from '../../types/ai';
import { requestUrl, RequestUrlParam } from 'obsidian';

const XAI_API_BASE = 'https://api.x.ai/v1';

export class XAIProvider implements AIClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model || 'grok-4-1-fast-reasoning';
  }

  async generateText(userPrompt: string, systemPrompt: string, temperature = 0.3): Promise<string> {
    const params: RequestUrlParam = {
      url: `${XAI_API_BASE}/chat/completions`,
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
        stream: false,
      }),
    };

    const response = await requestUrl(params);

    if (response.status !== 200) {
      throw new Error(`XAI API Error: ${response.status} - ${response.text}`);
    }

    const data = response.json;
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from XAI API');
    }

    return data.choices[0].message.content;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const params: RequestUrlParam = {
        url: `${XAI_API_BASE}/models`,
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
