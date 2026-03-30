import type { WidgetLayoutItem, NoteItem } from '../entities/settings.entity';
import { Settings, DashboardPage, LockLayout, NoteList, PlannerTask } from '../entities/settings.entity';

export abstract class SettingsPort {
  abstract getSettings(): Promise<Settings>;
  abstract updateSettings(partial: Partial<Settings>): Promise<Settings>;

  abstract getPages(): Promise<DashboardPage[]>;
  abstract setPages(pages: { id?: string; name: string; position: number; layout: WidgetLayoutItem[] }[]): Promise<DashboardPage[]>;

  abstract getLockLayout(): Promise<LockLayout>;
  abstract setLockLayout(layout: WidgetLayoutItem[]): Promise<LockLayout>;

  abstract getNoteLists(): Promise<NoteList[]>;
  abstract setNoteLists(lists: { id?: string; name: string; notes: NoteItem[] }[]): Promise<NoteList[]>;

  abstract getPlannerTasks(): Promise<PlannerTask[]>;
  abstract addPlannerTask(task: { text: string; days: string[]; color: string; recurrence: string; createdWeek: string }): Promise<PlannerTask>;
  abstract updatePlannerTask(id: string, task: Partial<{ text: string; days: string[]; color: string; recurrence: string; createdWeek: string }>): Promise<PlannerTask>;
  abstract removePlannerTask(id: string): Promise<void>;
}
