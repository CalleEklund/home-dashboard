import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });

  const config = new DocumentBuilder()
    .setTitle("home-dashboard API")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Write spec to shared package for type generation (dev only)
  if (!process.env.RAILWAY_ENVIRONMENT) {
    const specPath = path.resolve(__dirname, '../../../packages/api-schema/open-api-spec.json');
    fs.mkdirSync(path.dirname(specPath), { recursive: true });
    fs.writeFileSync(specPath, JSON.stringify(document, null, 2));
  }

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
