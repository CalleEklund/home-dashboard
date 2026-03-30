import { Module } from '@nestjs/common';
import { SettingsService } from './services/settings.service';
import { SettingsPort } from './ports/settings.port';
import { SettingsPgAdapter } from './adapters/settings-pg.adapter';
import { SettingsController } from './http/settings.controller';

@Module({
  controllers: [SettingsController],
  providers: [
    SettingsService,
    { provide: SettingsPort, useClass: SettingsPgAdapter },
  ],
})
export class SettingsModule {}
