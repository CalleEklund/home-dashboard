import { Module } from '@nestjs/common';
import { IntentClassifierPort } from './domain/ports/intent-classifier.port';
import { GeminiIntentClassifierAdapter } from './infrastructure/adapters/gemini-intent-classifier.adapter';
import { VoiceController } from './infrastructure/controllers/voice.controller';

@Module({
  controllers: [VoiceController],
  providers: [
    { provide: IntentClassifierPort, useClass: GeminiIntentClassifierAdapter },
  ],
})
export class VoiceModule {}
