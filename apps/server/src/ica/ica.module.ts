import { Module } from '@nestjs/common';
import { IcaService } from './services/ica.service';
import { IcaAuthPort } from './ports/ica-auth.port';
import { ShoppingListPort } from './ports/shopping-list.port';
import { IcaAuthAdapter } from './adapters/ica-auth.adapter';
import { ShoppingListAdapter } from './adapters/shopping-list.adapter';
import { IcaController } from './http/ica.controller';

@Module({
  controllers: [IcaController],
  providers: [
    IcaService,
    { provide: IcaAuthPort, useClass: IcaAuthAdapter },
    { provide: ShoppingListPort, useClass: ShoppingListAdapter },
  ],
})
export class IcaModule {}
