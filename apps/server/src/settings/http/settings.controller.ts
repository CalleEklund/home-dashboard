import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { HttpBorder, UseHttpBorder } from '@qte/nest-border-patrol';
import type { InferFromHttpBorder } from '@qte/nest-border-patrol';
import { z } from 'zod';
import { SettingsService } from '../services/settings.service';
import { OkSchema } from '../../shared/schemas';
import {
  SettingsSchema,
  UpdateSettingsBodySchema,
  DashboardPageSchema,
  SetPagesBodySchema,
  LockLayoutSchema,
  SetLockLayoutBodySchema,
  NoteListSchema,
  SetNoteListsBodySchema,
  PlannerTaskSchema,
  AddPlannerTaskBodySchema,
  UpdatePlannerTaskBodySchema,
} from '../schemas/settings.schemas';

// --- Settings ---

const getSettingsBorder = new HttpBorder({
  responses: { [HttpStatus.OK]: SettingsSchema },
});

const updateSettingsBorder = new HttpBorder({
  requestBody: UpdateSettingsBodySchema,
  responses: { [HttpStatus.OK]: SettingsSchema },
});

// --- Pages ---

const getPagesBorder = new HttpBorder({
  responses: { [HttpStatus.OK]: z.array(DashboardPageSchema) },
});

const setPagesBorder = new HttpBorder({
  requestBody: SetPagesBodySchema,
  responses: { [HttpStatus.OK]: z.array(DashboardPageSchema) },
});

// --- Lock Layout ---

const getLockLayoutBorder = new HttpBorder({
  responses: { [HttpStatus.OK]: LockLayoutSchema },
});

const setLockLayoutBorder = new HttpBorder({
  requestBody: SetLockLayoutBodySchema,
  responses: { [HttpStatus.OK]: LockLayoutSchema },
});

// --- Notes ---

const getNotesBorder = new HttpBorder({
  responses: { [HttpStatus.OK]: z.array(NoteListSchema) },
});

const setNotesBorder = new HttpBorder({
  requestBody: SetNoteListsBodySchema,
  responses: { [HttpStatus.OK]: z.array(NoteListSchema) },
});

// --- Planner Tasks ---

const getTasksBorder = new HttpBorder({
  responses: { [HttpStatus.OK]: z.array(PlannerTaskSchema) },
});

const addTaskBorder = new HttpBorder({
  requestBody: AddPlannerTaskBodySchema,
  responses: { [HttpStatus.OK]: PlannerTaskSchema },
});

const updateTaskBorder = new HttpBorder({
  parameters: { path: { id: z.string() } },
  requestBody: UpdatePlannerTaskBodySchema,
  responses: { [HttpStatus.OK]: PlannerTaskSchema },
});

const deleteTaskBorder = new HttpBorder({
  parameters: { path: { id: z.string() } },
  responses: { [HttpStatus.OK]: OkSchema },
});

@Controller('api')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // --- Settings ---

  @Get('settings')
  @UseHttpBorder(getSettingsBorder)
  async getSettings(): Promise<InferFromHttpBorder<typeof getSettingsBorder, 'response'>> {
    const settings = await this.settingsService.getSettings();
    return getSettingsBorder.createResponse(HttpStatus.OK, settings);
  }

  @Patch('settings')
  @UseHttpBorder(updateSettingsBorder)
  async updateSettings(
    @Body() body: InferFromHttpBorder<typeof updateSettingsBorder, 'requestBody'>,
  ): Promise<InferFromHttpBorder<typeof updateSettingsBorder, 'response'>> {
    const settings = await this.settingsService.updateSettings(body);
    return updateSettingsBorder.createResponse(HttpStatus.OK, settings);
  }

  // --- Pages ---

  @Get('pages')
  @UseHttpBorder(getPagesBorder)
  async getPages(): Promise<InferFromHttpBorder<typeof getPagesBorder, 'response'>> {
    const pages = await this.settingsService.getPages();
    return getPagesBorder.createResponse(HttpStatus.OK, pages);
  }

  @Put('pages')
  @UseHttpBorder(setPagesBorder)
  async setPages(
    @Body() body: InferFromHttpBorder<typeof setPagesBorder, 'requestBody'>,
  ): Promise<InferFromHttpBorder<typeof setPagesBorder, 'response'>> {
    const pages = await this.settingsService.setPages(body);
    return setPagesBorder.createResponse(HttpStatus.OK, pages);
  }

  // --- Lock Layout ---

  @Get('lock-layout')
  @UseHttpBorder(getLockLayoutBorder)
  async getLockLayout(): Promise<InferFromHttpBorder<typeof getLockLayoutBorder, 'response'>> {
    const lockLayout = await this.settingsService.getLockLayout();
    return getLockLayoutBorder.createResponse(HttpStatus.OK, lockLayout);
  }

  @Put('lock-layout')
  @UseHttpBorder(setLockLayoutBorder)
  async setLockLayout(
    @Body() body: InferFromHttpBorder<typeof setLockLayoutBorder, 'requestBody'>,
  ): Promise<InferFromHttpBorder<typeof setLockLayoutBorder, 'response'>> {
    const lockLayout = await this.settingsService.setLockLayout(body.layout);
    return setLockLayoutBorder.createResponse(HttpStatus.OK, lockLayout);
  }

  // --- Notes ---

  @Get('notes')
  @UseHttpBorder(getNotesBorder)
  async getNotes(): Promise<InferFromHttpBorder<typeof getNotesBorder, 'response'>> {
    const notes = await this.settingsService.getNoteLists();
    return getNotesBorder.createResponse(HttpStatus.OK, notes);
  }

  @Put('notes')
  @UseHttpBorder(setNotesBorder)
  async setNotes(
    @Body() body: InferFromHttpBorder<typeof setNotesBorder, 'requestBody'>,
  ): Promise<InferFromHttpBorder<typeof setNotesBorder, 'response'>> {
    const notes = await this.settingsService.setNoteLists(body);
    return setNotesBorder.createResponse(HttpStatus.OK, notes);
  }

  // --- Planner Tasks ---

  @Get('planner/tasks')
  @UseHttpBorder(getTasksBorder)
  async getTasks(): Promise<InferFromHttpBorder<typeof getTasksBorder, 'response'>> {
    const tasks = await this.settingsService.getPlannerTasks();
    return getTasksBorder.createResponse(HttpStatus.OK, tasks);
  }

  @Post('planner/tasks')
  @UseHttpBorder(addTaskBorder)
  async addTask(
    @Body() body: InferFromHttpBorder<typeof addTaskBorder, 'requestBody'>,
  ): Promise<InferFromHttpBorder<typeof addTaskBorder, 'response'>> {
    const task = await this.settingsService.addPlannerTask(body);
    return addTaskBorder.createResponse(HttpStatus.OK, task);
  }

  @Put('planner/tasks/:id')
  @UseHttpBorder(updateTaskBorder)
  async updateTask(
    @Param() params: InferFromHttpBorder<typeof updateTaskBorder, 'pathParameters'>,
    @Body() body: InferFromHttpBorder<typeof updateTaskBorder, 'requestBody'>,
  ): Promise<InferFromHttpBorder<typeof updateTaskBorder, 'response'>> {
    const task = await this.settingsService.updatePlannerTask(params.id, body);
    return updateTaskBorder.createResponse(HttpStatus.OK, task);
  }

  @Delete('planner/tasks/:id')
  @UseHttpBorder(deleteTaskBorder)
  async deleteTask(
    @Param() params: InferFromHttpBorder<typeof deleteTaskBorder, 'pathParameters'>,
  ): Promise<InferFromHttpBorder<typeof deleteTaskBorder, 'response'>> {
    await this.settingsService.removePlannerTask(params.id);
    return deleteTaskBorder.createResponse(HttpStatus.OK, { ok: true });
  }
}
