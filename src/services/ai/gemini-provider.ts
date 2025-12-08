import { AIClient } from '../../types/ai';
import { requestUrl, RequestUrlParam } from 'obsidian';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiProvider implements AIClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model || 'gemini-2.5-flash';
  }

  async generateText(userPrompt: string, systemPrompt: string, temperature = 0.3): Promise<string> {
    const requestBody: Record<string, unknown> = {
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: 2048,
      },
    };

    if (systemPrompt) {
      requestBody.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const params: RequestUrlParam = {
      url: `${GEMINI_API_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    };

    const response = await requestUrl(params);

    if (response.status !== 200) {
      throw new Error(`Gemini API Error: ${response.status} - ${response.text}`);
    }

    const data = response.json;
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part?.text || '')
      .join('')
      .trim();

    if (!text) {
      throw new Error('No response from Gemini API');
    }

    return text;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const params: RequestUrlParam = {
        url: `${GEMINI_API_BASE}/models?key=${this.apiKey}`,
        method: 'GET',
      };
      const response = await requestUrl(params);
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
