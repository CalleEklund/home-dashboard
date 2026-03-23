import { useState, useEffect, useCallback } from "react"
import { usePages } from "./kernel/hooks/usePages"
import { useLockLayout } from "./kernel/hooks/useLockLayout"
import { useLockScreen } from "./kernel/hooks/useLockScreen"
import Dashboard from "./ui/components/Dashboard"
import LockScreen from "./ui/components/LockScreen"
import Toolbar from "./ui/components/Toolbar"

function loadTimeout(): number {
  try {
    const raw = localStorage.getItem("fridge_lock_timeout")
    if (raw) return Number(raw)
  } catch { /* ignore */ }
  return 5
}

export default function App() {
  const pagesState = usePages()
  const lockLayout = useLockLayout()
  const [showToolbar, setShowToolbar] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingLockScreen, setEditingLockScreen] = useState(false)
  const [timeoutMins, setTimeoutMins] = useState(loadTimeout)
  const { locked, lock, unlock } = useLockScreen(timeoutMins)

  useEffect(() => {
    localStorage.setItem("fridge_lock_timeout", String(timeoutMins))
  }, [timeoutMins])

  // Ctrl+E toggles toolbar
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "e") {
      e.preventDefault()
      setShowToolbar((v) => !v)
    }
  }, [])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Keep toolbar visible while in edit mode
  const toolbarVisible = showToolbar || editMode

  const activeOps = editingLockScreen ? lockLayout : pagesState

  return (
    <>
      {locked && <LockScreen layout={lockLayout.layout} onUnlock={unlock} />}
      <div className="min-h-screen bg-[#181825]">
        <Toolbar
          visible={toolbarVisible}
          editMode={editMode}
          editingLockScreen={editingLockScreen}
          pages={pagesState.pages}
          activePageIndex={pagesState.activePageIndex}
          onPageChange={pagesState.setActivePageIndex}
          onAddPage={pagesState.addPage}
          onDeletePage={pagesState.deletePage}
          onRenamePage={pagesState.renamePage}
          onToggleEdit={() => {
            setEditMode((e) => !e)
            setEditingLockScreen(false)
          }}
          onToggleLockEdit={() => {
            setEditingLockScreen((e) => !e)
            setEditMode(true)
          }}
          onLock={lock}
          layout={activeOps.layout}
          onAdd={activeOps.addWidget}
          onRemove={activeOps.removeWidget}
          onReset={activeOps.resetLayout}
          timeoutMins={timeoutMins}
          onTimeoutChange={setTimeoutMins}
        />
        {editingLockScreen ? (
          <Dashboard
            pages={[{ id: "lock", name: "Lock Screen", layout: lockLayout.layout }]}
            activePageIndex={0}
            onPageChange={() => {}}
            editMode={editMode}
            onMove={lockLayout.moveWidget}
            onResize={lockLayout.resizeWidget}
          />
        ) : (
          <Dashboard
            pages={pagesState.pages}
            activePageIndex={pagesState.activePageIndex}
            onPageChange={pagesState.setActivePageIndex}
            editMode={editMode}
            onMove={pagesState.moveWidget}
            onResize={pagesState.resizeWidget}
          />
        )}
      </div>
    </>
  )
}
