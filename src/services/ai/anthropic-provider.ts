import { AIClient } from '../../types/ai';
import { requestUrl, RequestUrlParam } from 'obsidian';

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';

export class AnthropicProvider implements AIClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model || 'claude-sonnet-4-5-20250929';
  }

  async generateText(userPrompt: string, systemPrompt: string, temperature = 0.3): Promise<string> {
    const params: RequestUrlParam = {
      url: `${ANTHROPIC_API_BASE}/messages`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    };

    const response = await requestUrl(params);

    if (response.status !== 200) {
      throw new Error(`Anthropic API Error: ${response.status} - ${response.text}`);
    }

    const data = response.json;
    if (!data.content || data.content.length === 0) {
      throw new Error('No response from Anthropic API');
    }

    return data.content[0].text;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // Anthropic doesn't have a models endpoint, do a minimal request
      await this.generateText('test', 'Reply with OK', 0);
      return true;
    } catch {
      return false;
    }
  }
}
