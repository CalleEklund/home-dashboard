import { Module } from '@nestjs/common';
import { BorderPatrolModule } from '@qte/nest-border-patrol';
import { PostgresModule } from './kernel/postgres';
import { IcaModule } from './ica/ica.module';
import { CalendarModule } from './calendar/calendar.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    BorderPatrolModule.forRootAsync({
      imports: [],
      useFactory: () => ({}),
      inject: [],
    }),
    PostgresModule.forRootAsync({
      useFactory: () => ({
        connectionUri:
          process.env.DATABASE_URL ??
          'postgres://home-dashboard:home-dashboard@localhost:5432/home-dashboard',
      }),
    }),
    IcaModule,
    CalendarModule,
    SettingsModule,
  ],
})
export class AppModule {}
