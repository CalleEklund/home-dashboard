import * as settingsApi from "./settings"

const MIGRATED_KEY = "fridge_migrated"

export async function migrateFromLocalStorage(): Promise<void> {
  if (localStorage.getItem(MIGRATED_KEY)) return

  try {
    // Settings
    const timeout = localStorage.getItem("fridge_lock_timeout")
    const depsRaw = localStorage.getItem("fridge_departures_settings")
    const icaListId = localStorage.getItem("fridge_ica_list_id")

    const settingsUpdate: Partial<settingsApi.SettingsData> = {}
    if (timeout) settingsUpdate.lockTimeoutMins = Number(timeout)
    if (depsRaw) {
      const deps = JSON.parse(depsRaw)
      settingsUpdate.departuresSiteId = deps.siteId
      settingsUpdate.departuresSiteName = deps.siteName
      settingsUpdate.departuresCount = deps.count
    }
    if (icaListId) settingsUpdate.icaListId = icaListId
    if (Object.keys(settingsUpdate).length > 0) {
      await settingsApi.updateSettings(settingsUpdate)
    }

    // Pages
    const pagesRaw = localStorage.getItem("fridge_pages")
    if (pagesRaw) {
      const pages = JSON.parse(pagesRaw)
      if (Array.isArray(pages) && pages.length > 0) {
        await settingsApi.setPages(
          pages.map((p: { id: string; name: string; layout: unknown[] }, i: number) => ({
            id: p.id,
            name: p.name,
            position: i,
            layout: p.layout,
          })),
        )
      }
    }

    // Lock layout
    const lockRaw = localStorage.getItem("fridge_lock_layout")
    if (lockRaw) {
      const layout = JSON.parse(lockRaw)
      if (Array.isArray(layout)) {
        await settingsApi.setLockLayout(layout)
      }
    }

    // Notes
    const notesRaw = localStorage.getItem("fridge_notes")
    if (notesRaw) {
      const notes = JSON.parse(notesRaw)
      if (Array.isArray(notes) && notes.length > 0) {
        // Handle old flat format
        if ("text" in notes[0]) {
          await settingsApi.setNoteLists([{ id: "default", name: "Notes", notes }])
        } else {
          await settingsApi.setNoteLists(notes)
        }
      }
    }

    // Planner tasks
    const plannerRaw = localStorage.getItem("fridge_weekly_planner")
    if (plannerRaw) {
      const tasks = JSON.parse(plannerRaw)
      if (Array.isArray(tasks)) {
        for (const t of tasks) {
          await settingsApi.addPlannerTask({
            text: t.text,
            days: t.days,
            color: t.color,
            recurrence: t.recurrence ?? (t.recurring ? "weekly" : "once"),
            createdWeek: t.createdWeek ?? new Date().toISOString(),
          })
        }
      }
    }

    // Mark as migrated and clear old keys
    localStorage.setItem(MIGRATED_KEY, "true")
    localStorage.removeItem("fridge_lock_timeout")
    localStorage.removeItem("fridge_departures_settings")
    localStorage.removeItem("fridge_ica_list_id")
    localStorage.removeItem("fridge_pages")
    localStorage.removeItem("fridge_layout")
    localStorage.removeItem("fridge_lock_layout")
    localStorage.removeItem("fridge_notes")
    localStorage.removeItem("fridge_weekly_planner")
  } catch {
    // Migration failed — will retry next load
  }
}
