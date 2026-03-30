const API_BASE = `${import.meta.env.VITE_API_URL ?? "http://localhost:3001"}/api`

export type SettingsData = {
  lockTimeoutMins: number
  departuresSiteId: number | null
  departuresSiteName: string
  departuresCount: number
  icaListId: string | null
}

export type DashboardPageData = {
  id: string
  name: string
  position: number
  layout: unknown[]
}

export type LockLayoutData = {
  layout: unknown[]
}

export type NoteListData = {
  id: string
  name: string
  notes: { id: string; text: string }[]
}

export type PlannerTaskData = {
  id: string
  text: string
  days: string[]
  color: string
  recurrence: string
  createdWeek: string
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

// --- Settings ---

export async function getSettings(): Promise<SettingsData> {
  return json(await fetch(`${API_BASE}/settings`))
}

export async function updateSettings(partial: Partial<SettingsData>): Promise<SettingsData> {
  return json(
    await fetch(`${API_BASE}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    }),
  )
}

// --- Pages ---

export async function getPages(): Promise<DashboardPageData[]> {
  return json(await fetch(`${API_BASE}/pages`))
}

export async function setPages(pages: DashboardPageData[]): Promise<DashboardPageData[]> {
  return json(
    await fetch(`${API_BASE}/pages`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pages),
    }),
  )
}

// --- Lock Layout ---

export async function getLockLayout(): Promise<LockLayoutData> {
  return json(await fetch(`${API_BASE}/lock-layout`))
}

export async function setLockLayout(layout: unknown[]): Promise<LockLayoutData> {
  return json(
    await fetch(`${API_BASE}/lock-layout`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layout }),
    }),
  )
}

// --- Notes ---

export async function getNoteLists(): Promise<NoteListData[]> {
  return json(await fetch(`${API_BASE}/notes`))
}

export async function setNoteLists(lists: NoteListData[]): Promise<NoteListData[]> {
  return json(
    await fetch(`${API_BASE}/notes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lists),
    }),
  )
}

// --- Planner Tasks ---

export async function getPlannerTasks(): Promise<PlannerTaskData[]> {
  return json(await fetch(`${API_BASE}/planner/tasks`))
}

export async function addPlannerTask(
  task: Omit<PlannerTaskData, "id">,
): Promise<PlannerTaskData> {
  return json(
    await fetch(`${API_BASE}/planner/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    }),
  )
}

export async function deletePlannerTask(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/planner/tasks/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
}
