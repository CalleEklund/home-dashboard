import { Module } from '@nestjs/common';
import { BorderPatrolModule } from '@qte/nest-border-patrol';
import { IcaModule } from './ica/ica.module';
import { CalendarModule } from './calendar/calendar.module';

@Module({
  imports: [
    BorderPatrolModule.forRootAsync({
      imports: [],
      useFactory: () => ({}),
      inject: [],
    }),
    IcaModule,
    CalendarModule,
  ],
})
export class AppModule {}
