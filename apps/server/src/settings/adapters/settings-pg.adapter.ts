import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { sql, InjectPostgresPool, type PostgresPool } from '../../kernel/postgres';
import { SettingsPort } from '../ports/settings.port';
import type { WidgetLayoutItem, NoteItem } from '../entities/settings.entity';
import { Settings, DashboardPage, LockLayout, NoteList, PlannerTask } from '../entities/settings.entity';

const SettingsRowSchema = z.object({
  lock_timeout_mins: z.number(),
  departures_site_id: z.number().nullable(),
  departures_site_name: z.string(),
  departures_count: z.number(),
  departures_routes: z.array(z.any()),
  ica_list_id: z.string().nullable(),
});

const PageRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  position: z.number(),
  layout: z.array(z.any()),
});

const LockLayoutRowSchema = z.object({
  layout: z.array(z.any()),
});

const NoteListRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  notes: z.array(z.any()),
});

const PlannerTaskRowSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  days: z.array(z.any()),
  color: z.string(),
  recurrence: z.string(),
  created_week: z.string(),
});

@Injectable()
export class SettingsPgAdapter extends SettingsPort {
  constructor(
    @InjectPostgresPool() private readonly pool: PostgresPool,
  ) {
    super();
  }

  async getSettings(): Promise<Settings> {
    await this.pool.query(
      sql.unsafe`INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`,
    );
    const row = await this.pool.one(
      sql.type(SettingsRowSchema)`SELECT * FROM settings WHERE id = 1`,
    );
    return this.mapSettings(row);
  }

  async updateSettings(partial: Partial<Settings>): Promise<Settings> {
    await this.pool.query(
      sql.unsafe`INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`,
    );

    const fragments: ReturnType<typeof sql.fragment>[] = [];

    if (partial.lockTimeoutMins !== undefined) {
      fragments.push(sql.fragment`lock_timeout_mins = ${partial.lockTimeoutMins}`);
    }
    if (partial.departuresSiteId !== undefined) {
      fragments.push(sql.fragment`departures_site_id = ${partial.departuresSiteId ?? null}`);
    }
    if (partial.departuresSiteName !== undefined) {
      fragments.push(sql.fragment`departures_site_name = ${partial.departuresSiteName}`);
    }
    if (partial.departuresCount !== undefined) {
      fragments.push(sql.fragment`departures_count = ${partial.departuresCount}`);
    }
    if (partial.departuresRoutes !== undefined) {
      fragments.push(sql.fragment`departures_routes = ${JSON.stringify(partial.departuresRoutes)}::jsonb`);
    }
    if (partial.icaListId !== undefined) {
      fragments.push(sql.fragment`ica_list_id = ${partial.icaListId ?? null}`);
    }

    if (fragments.length === 0) return this.getSettings();

    const row = await this.pool.one(
      sql.type(SettingsRowSchema)`
        UPDATE settings SET ${sql.join(fragments, sql.fragment`, `)}
        WHERE id = 1
        RETURNING *
      `,
    );
    return this.mapSettings(row);
  }

  async getPages(): Promise<DashboardPage[]> {
    const result = await this.pool.query(
      sql.type(PageRowSchema)`SELECT * FROM dashboard_pages ORDER BY position`,
    );
    return [...result.rows].map(
      (r) => new DashboardPage(r.id, r.name, r.position, r.layout as WidgetLayoutItem[]),
    );
  }

  async setPages(pages: { id?: string; name: string; position: number; layout: WidgetLayoutItem[] }[]): Promise<DashboardPage[]> {
    await this.pool.query(sql.unsafe`DELETE FROM dashboard_pages`);

    const result: DashboardPage[] = [];
    for (const page of pages) {
      const row = await this.pool.one(
        sql.type(PageRowSchema)`
          INSERT INTO dashboard_pages (id, name, position, layout)
          VALUES (COALESCE(${page.id ?? null}::uuid, gen_random_uuid()), ${page.name}, ${page.position}, ${JSON.stringify(page.layout)}::jsonb)
          RETURNING *
        `,
      );
      result.push(new DashboardPage(row.id, row.name, row.position, row.layout as WidgetLayoutItem[]));
    }
    return result;
  }

  async getLockLayout(): Promise<LockLayout> {
    await this.pool.query(
      sql.unsafe`INSERT INTO lock_layout (id) VALUES (1) ON CONFLICT (id) DO NOTHING`,
    );
    const row = await this.pool.one(
      sql.type(LockLayoutRowSchema)`SELECT * FROM lock_layout WHERE id = 1`,
    );
    return new LockLayout(row.layout as WidgetLayoutItem[]);
  }

  async setLockLayout(layout: WidgetLayoutItem[]): Promise<LockLayout> {
    await this.pool.query(
      sql.unsafe`
        INSERT INTO lock_layout (id, layout) VALUES (1, ${JSON.stringify(layout)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET layout = ${JSON.stringify(layout)}::jsonb
      `,
    );
    return new LockLayout(layout);
  }

  async getNoteLists(): Promise<NoteList[]> {
    const result = await this.pool.query(
      sql.type(NoteListRowSchema)`SELECT * FROM note_lists`,
    );
    return [...result.rows].map(
      (r) => new NoteList(r.id, r.name, r.notes as NoteItem[]),
    );
  }

  async setNoteLists(lists: { id?: string; name: string; notes: NoteItem[] }[]): Promise<NoteList[]> {
    await this.pool.query(sql.unsafe`DELETE FROM note_lists`);

    const result: NoteList[] = [];
    for (const list of lists) {
      const row = await this.pool.one(
        sql.type(NoteListRowSchema)`
          INSERT INTO note_lists (id, name, notes)
          VALUES (COALESCE(${list.id ?? null}::uuid, gen_random_uuid()), ${list.name}, ${JSON.stringify(list.notes)}::jsonb)
          RETURNING *
        `,
      );
      result.push(new NoteList(row.id, row.name, row.notes as NoteItem[]));
    }
    return result;
  }

  async getPlannerTasks(): Promise<PlannerTask[]> {
    const result = await this.pool.query(
      sql.type(PlannerTaskRowSchema)`SELECT * FROM planner_tasks`,
    );
    return [...result.rows].map(
      (r) => new PlannerTask(r.id, r.text, r.days as string[], r.color, r.recurrence, r.created_week),
    );
  }

  async addPlannerTask(task: { text: string; days: string[]; color: string; recurrence: string; createdWeek: string }): Promise<PlannerTask> {
    const row = await this.pool.one(
      sql.type(PlannerTaskRowSchema)`
        INSERT INTO planner_tasks (text, days, color, recurrence, created_week)
        VALUES (${task.text}, ${JSON.stringify(task.days)}::jsonb, ${task.color}, ${task.recurrence}, ${task.createdWeek})
        RETURNING *
      `,
    );
    return new PlannerTask(row.id, row.text, row.days as string[], row.color, row.recurrence, row.created_week);
  }

  async updatePlannerTask(id: string, task: Partial<{ text: string; days: string[]; color: string; recurrence: string; createdWeek: string }>): Promise<PlannerTask> {
    const fragments: ReturnType<typeof sql.fragment>[] = [];

    if (task.text !== undefined) fragments.push(sql.fragment`text = ${task.text}`);
    if (task.days !== undefined) fragments.push(sql.fragment`days = ${JSON.stringify(task.days)}::jsonb`);
    if (task.color !== undefined) fragments.push(sql.fragment`color = ${task.color}`);
    if (task.recurrence !== undefined) fragments.push(sql.fragment`recurrence = ${task.recurrence}`);
    if (task.createdWeek !== undefined) fragments.push(sql.fragment`created_week = ${task.createdWeek}`);

    if (fragments.length === 0) {
      const row = await this.pool.one(
        sql.type(PlannerTaskRowSchema)`SELECT * FROM planner_tasks WHERE id = ${id}`,
      );
      return new PlannerTask(row.id, row.text, row.days as string[], row.color, row.recurrence, row.created_week);
    }

    const row = await this.pool.one(
      sql.type(PlannerTaskRowSchema)`
        UPDATE planner_tasks SET ${sql.join(fragments, sql.fragment`, `)}
        WHERE id = ${id}
        RETURNING *
      `,
    );
    return new PlannerTask(row.id, row.text, row.days as string[], row.color, row.recurrence, row.created_week);
  }

  async removePlannerTask(id: string): Promise<void> {
    await this.pool.query(
      sql.unsafe`DELETE FROM planner_tasks WHERE id = ${id}`,
    );
  }

  private mapSettings(row: z.infer<typeof SettingsRowSchema>): Settings {
    return new Settings(
      row.lock_timeout_mins,
      row.departures_site_id,
      row.departures_site_name,
      row.departures_count,
      row.departures_routes as string[],
      row.ica_list_id,
    );
  }
}
