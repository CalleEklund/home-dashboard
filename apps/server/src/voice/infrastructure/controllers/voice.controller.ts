import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IntentClassifierPort } from '../../domain/ports/intent-classifier.port';

class ClassifyDto {
  transcript: string;
}

@ApiTags('voice')
@Controller('api/voice')
export class VoiceController {
  constructor(private readonly classifier: IntentClassifierPort) {}

  @Post('classify')
  @ApiOperation({ summary: 'Classify a voice transcript into an intent' })
  async classify(@Body() body: ClassifyDto) {
    return this.classifier.classify(body.transcript);
  }
}
