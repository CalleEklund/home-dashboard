import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { HttpBorder, UseHttpBorder } from '@qte/nest-border-patrol';
import type { InferFromHttpBorder } from '@qte/nest-border-patrol';
import { z } from 'zod';
import { IcaService } from '../services/ica.service';
import { IcaMapper } from '../mappers/ica.mapper';
import { OkSchema } from '../../shared/schemas';
import {
  IcaStatusSchema,
  LoginStartSchema,
  LoginPollSchema,
  ShoppingListSchema,
  CreateListBodySchema,
  AddItemBodySchema,
} from '../schemas/ica.schemas';

const statusBorder = new HttpBorder({
  responses: { [HttpStatus.OK]: IcaStatusSchema },
});

const loginStartBorder = new HttpBorder({
  responses: { [HttpStatus.OK]: LoginStartSchema },
});

const loginPollBorder = new HttpBorder({
  responses: { [HttpStatus.OK]: LoginPollSchema },
});

const okBorder = new HttpBorder({
  responses: { [HttpStatus.OK]: OkSchema },
});

const listsBorder = new HttpBorder({
  responses: { [HttpStatus.OK]: z.array(ShoppingListSchema) },
});

const createListBorder = new HttpBorder({
  requestBody: CreateListBodySchema,
  responses: { [HttpStatus.OK]: ShoppingListSchema },
});

const deleteListBorder = new HttpBorder({
  parameters: { path: { listId: z.string() } },
  responses: { [HttpStatus.OK]: OkSchema },
});

const addItemBorder = new HttpBorder({
  requestBody: AddItemBodySchema,
  parameters: { path: { listId: z.string() } },
  responses: { [HttpStatus.OK]: OkSchema },
});

const removeItemBorder = new HttpBorder({
  parameters: { path: { rowId: z.string() } },
  responses: { [HttpStatus.OK]: OkSchema },
});

@Controller('api/ica')
export class IcaController {
  constructor(private readonly icaService: IcaService) {}

  @Get('status')
  @UseHttpBorder(statusBorder)
  status(): InferFromHttpBorder<typeof statusBorder, 'response'> {
    return statusBorder.createResponse(HttpStatus.OK, {
      authenticated: this.icaService.isAuthenticated(),
    });
  }

  @Post('login/start')
  @UseHttpBorder(loginStartBorder)
  async startLogin(): Promise<InferFromHttpBorder<typeof loginStartBorder, 'response'>> {
    const result = await this.icaService.startLogin();
    return loginStartBorder.createResponse(HttpStatus.OK, result);
  }

  @Get('login/poll')
  @UseHttpBorder(loginPollBorder)
  async pollLogin(): Promise<InferFromHttpBorder<typeof loginPollBorder, 'response'>> {
    const result = await this.icaService.pollLogin();
    return loginPollBorder.createResponse(HttpStatus.OK, IcaMapper.toPollHttp(result));
  }

  @Post('login/cancel')
  @UseHttpBorder(okBorder)
  async cancelLogin(): Promise<InferFromHttpBorder<typeof okBorder, 'response'>> {
    await this.icaService.cancelLogin();
    return okBorder.createResponse(HttpStatus.OK, { ok: true });
  }

  @Post('logout')
  @UseHttpBorder(okBorder)
  logout(): InferFromHttpBorder<typeof okBorder, 'response'> {
    this.icaService.logout();
    return okBorder.createResponse(HttpStatus.OK, { ok: true });
  }

  @Get('lists')
  @UseHttpBorder(listsBorder)
  async getLists(): Promise<InferFromHttpBorder<typeof listsBorder, 'response'>> {
    const lists = await this.icaService.getLists();
    return listsBorder.createResponse(HttpStatus.OK, IcaMapper.toListsHttp(lists));
  }

  @Post('lists')
  @UseHttpBorder(createListBorder)
  async createList(
    @Body() body: InferFromHttpBorder<typeof createListBorder, 'requestBody'>,
  ): Promise<InferFromHttpBorder<typeof createListBorder, 'response'>> {
    const list = await this.icaService.createList(body.name);
    return createListBorder.createResponse(HttpStatus.OK, IcaMapper.toListHttp(list));
  }

  @Delete('lists/:listId')
  @UseHttpBorder(deleteListBorder)
  async deleteList(
    @Param() params: InferFromHttpBorder<typeof deleteListBorder, 'pathParameters'>,
  ): Promise<InferFromHttpBorder<typeof deleteListBorder, 'response'>> {
    await this.icaService.deleteList(params.listId);
    return deleteListBorder.createResponse(HttpStatus.OK, { ok: true });
  }

  @Post('lists/:listId/items')
  @UseHttpBorder(addItemBorder)
  async addItem(
    @Param() params: InferFromHttpBorder<typeof addItemBorder, 'pathParameters'>,
    @Body() body: InferFromHttpBorder<typeof addItemBorder, 'requestBody'>,
  ): Promise<InferFromHttpBorder<typeof addItemBorder, 'response'>> {
    await this.icaService.addItem(params.listId, body.text);
    return addItemBorder.createResponse(HttpStatus.OK, { ok: true });
  }

  @Delete('items/:rowId')
  @UseHttpBorder(removeItemBorder)
  async removeItem(
    @Param() params: InferFromHttpBorder<typeof removeItemBorder, 'pathParameters'>,
  ): Promise<InferFromHttpBorder<typeof removeItemBorder, 'response'>> {
    await this.icaService.removeItem(params.rowId);
    return removeItemBorder.createResponse(HttpStatus.OK, { ok: true });
  }
}
