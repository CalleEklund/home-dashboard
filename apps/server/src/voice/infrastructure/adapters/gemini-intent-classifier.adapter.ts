import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { IntentClassifierPort } from '../../domain/ports/intent-classifier.port';
import type { Intent } from '../../domain/ports/intent-classifier.port';

const SYSTEM_PROMPT = `You are an intent classifier for a home dashboard voice assistant.
The user speaks in Swedish or English. Classify the transcript into exactly one intent.

Every response MUST include a "lang" field with the BCP-47 language code the user spoke (e.g. "sv-SE", "en-US").

Respond with ONLY a JSON object matching one of these shapes:
- {"type":"shopping-add","item":"<the item in the original language>","lang":"..."}
- {"type":"weather-query","lang":"..."}
- {"type":"departures-query","lang":"..."}
- {"type":"calendar-query","lang":"..."}
- {"type":"general-query","answer":"<your helpful answer, respond in the same language the user spoke>","lang":"..."}

Rules:
- "shopping-add": user wants to add something to a shopping/grocery list
- "weather-query": user asks about weather, temperature, or conditions
- "departures-query": user asks about buses, trains, departures, or public transport
- "calendar-query": user asks about calendar, events, meetings, or schedule
- "general-query": anything else — answer the question or respond helpfully. Keep answers concise (1-3 sentences).

Return ONLY valid JSON, no markdown, no explanation.`;

@Injectable()
export class GeminiIntentClassifierAdapter extends IntentClassifierPort {
  private readonly logger = new Logger(GeminiIntentClassifierAdapter.name);
  private readonly client: GoogleGenAI | null = null;

  constructor(private readonly config: ConfigService) {
    super();
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  async classify(transcript: string): Promise<Intent> {
    if (!this.client) {
      this.logger.warn('GEMINI_API_KEY not configured, falling back to unknown');
      return { type: 'unknown', transcript };
    }

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: transcript,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0,
        },
      });

      const text = response.text?.trim();
      if (!text) {
        return { type: 'unknown', transcript };
      }

      const parsed = JSON.parse(text);
      if (!parsed.type) {
        return { type: 'unknown', transcript };
      }

      return parsed as Intent;
    } catch (err) {
      this.logger.error('Gemini classification failed', err);
      return { type: 'unknown', transcript };
    }
  }
}
