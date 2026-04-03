import { useState, useEffect, useCallback } from "react"
import { usePages } from "./kernel/hooks/usePages"
import { useLockLayout } from "./kernel/hooks/useLockLayout"
import { useLockScreen } from "./kernel/hooks/useLockScreen"
import Dashboard from "./ui/components/Dashboard"
import LockScreen from "./ui/components/LockScreen"
import VoiceButton from "./features/voice-command/VoiceButton"
import * as settingsApi from "./kernel/api/settings"

export type EditTarget =
  | { type: "page"; pageIndex: number }
  | { type: "lock" }
  | null

export default function App() {
  const pagesState = usePages()
  const lockLayout = useLockLayout()
  const [editTarget, setEditTarget] = useState<EditTarget>(null)
  const [timeoutMins, setTimeoutMins] = useState(5)
  const { locked, lock, unlock } = useLockScreen(timeoutMins)

  // Load timeout from server
  useEffect(() => {
    settingsApi.getSettings().then((s) => setTimeoutMins(s.lockTimeoutMins)).catch(() => {})
  }, [])

  const handleTimeoutChange = useCallback((mins: number) => {
    setTimeoutMins(mins)
    settingsApi.updateSettings({ lockTimeoutMins: mins }).catch(() => {})
  }, [])

  const editMode = editTarget !== null
  const editingLockScreen = editTarget?.type === "lock"

  const startEditPage = (pageIndex: number) => {
    pagesState.setActivePageIndex(pageIndex)
    setEditTarget({ type: "page", pageIndex })
  }

  const startEditLock = () => {
    setEditTarget({ type: "lock" })
  }

  const stopEditing = () => {
    setEditTarget(null)
  }

  const activeOps = editingLockScreen ? lockLayout : pagesState
  const reorderWidgets = activeOps.reorderWidgets

  return (
    <>
      {locked && <LockScreen layout={lockLayout.layout} onUnlock={unlock} />}
      <div className="min-h-screen bg-[#181825]">
        {editingLockScreen ? (
          <Dashboard
            pages={[{ id: "lock", name: "Lock Screen", layout: lockLayout.layout }]}
            activePageIndex={0}
            onPageChange={() => {}}
            editMode={editMode}
            editTarget={editTarget}
            onMove={lockLayout.moveWidget}
            onResize={lockLayout.resizeWidget}
            onStopEditing={stopEditing}
            layout={activeOps.layout}
            onAdd={activeOps.addWidget}
            onRemove={activeOps.removeWidget}
            onReorder={reorderWidgets}
            onReset={activeOps.resetLayout}
            settingsPageProps={{
              pages: pagesState.pages,
              onEditPage: startEditPage,
              onEditLockScreen: startEditLock,
              onLock: lock,
              timeoutMins,
              onTimeoutChange: handleTimeoutChange,
              onAddPage: pagesState.addPage,
              onDeletePage: pagesState.deletePage,
              onRenamePage: pagesState.renamePage,
            }}
          />
        ) : (
          <Dashboard
            pages={pagesState.pages}
            activePageIndex={pagesState.activePageIndex}
            onPageChange={pagesState.setActivePageIndex}
            editMode={editMode}
            editTarget={editTarget}
            onMove={pagesState.moveWidget}
            onResize={pagesState.resizeWidget}
            onStopEditing={stopEditing}
            layout={activeOps.layout}
            onAdd={activeOps.addWidget}
            onRemove={activeOps.removeWidget}
            onReorder={reorderWidgets}
            onReset={activeOps.resetLayout}
            settingsPageProps={{
              pages: pagesState.pages,
              onEditPage: startEditPage,
              onEditLockScreen: startEditLock,
              onLock: lock,
              timeoutMins,
              onTimeoutChange: handleTimeoutChange,
              onAddPage: pagesState.addPage,
              onDeletePage: pagesState.deletePage,
              onRenamePage: pagesState.renamePage,
            }}
          />
        )}
        <VoiceButton />
      </div>
    </>
  )
}
