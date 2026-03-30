import { Injectable } from '@nestjs/common';
import { SettingsPort } from '../ports/settings.port';
import type { WidgetLayoutItem, NoteItem } from '../entities/settings.entity';
import { Settings, DashboardPage, LockLayout, NoteList, PlannerTask } from '../entities/settings.entity';

@Injectable()
export class SettingsService {
  constructor(private readonly settingsPort: SettingsPort) {}

  getSettings(): Promise<Settings> {
    return this.settingsPort.getSettings();
  }

  updateSettings(partial: Partial<Settings>): Promise<Settings> {
    return this.settingsPort.updateSettings(partial);
  }

  getPages(): Promise<DashboardPage[]> {
    return this.settingsPort.getPages();
  }

  setPages(pages: { id?: string; name: string; position: number; layout: WidgetLayoutItem[] }[]): Promise<DashboardPage[]> {
    return this.settingsPort.setPages(pages);
  }

  getLockLayout(): Promise<LockLayout> {
    return this.settingsPort.getLockLayout();
  }

  setLockLayout(layout: WidgetLayoutItem[]): Promise<LockLayout> {
    return this.settingsPort.setLockLayout(layout);
  }

  getNoteLists(): Promise<NoteList[]> {
    return this.settingsPort.getNoteLists();
  }

  setNoteLists(lists: { id?: string; name: string; notes: NoteItem[] }[]): Promise<NoteList[]> {
    return this.settingsPort.setNoteLists(lists);
  }

  getPlannerTasks(): Promise<PlannerTask[]> {
    return this.settingsPort.getPlannerTasks();
  }

  addPlannerTask(task: { text: string; days: string[]; color: string; recurrence: string; createdWeek: string }): Promise<PlannerTask> {
    return this.settingsPort.addPlannerTask(task);
  }

  updatePlannerTask(id: string, task: Partial<{ text: string; days: string[]; color: string; recurrence: string; createdWeek: string }>): Promise<PlannerTask> {
    return this.settingsPort.updatePlannerTask(id, task);
  }

  removePlannerTask(id: string): Promise<void> {
    return this.settingsPort.removePlannerTask(id);
  }
}
