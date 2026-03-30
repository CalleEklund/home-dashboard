import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BorderPatrolModule } from '@qte/nest-border-patrol';
import { PostgresModule } from './kernel/postgres';
import { IcaModule } from './ica/ica.module';
import { CalendarModule } from './calendar/calendar.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BorderPatrolModule.forRootAsync({
      imports: [],
      useFactory: () => ({}),
      inject: [],
    }),
    PostgresModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connectionUri: config.getOrThrow<string>('DATABASE_URL'),
      }),
      inject: [ConfigService],
    }),
    IcaModule,
    CalendarModule,
    SettingsModule,
  ],
})
export class AppModule {}
