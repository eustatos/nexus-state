import { useTimeTravel } from '@/hooks/useTimeTravel'
import { SimpleEditor, EditorToolbar, EditorStats } from './components/Editor'
import { SnapshotList } from './components/Snapshots'
import { TimelineSlider, NavigationControls } from './components/Timeline'
import { useSetAtom } from '@nexus-state/react'
import { contentAtom, isDirtyAtom } from '@/store/atoms/editor'
import { editorStore } from '@/store/store'
import './App.css'

function App() {
  const setContent = useSetAtom(contentAtom, editorStore)
  const setIsDirty = useSetAtom(isDirtyAtom, editorStore)
  const { snapshotsCount, jumpTo } = useTimeTravel()

  const handleClear = () => {
    setContent('')
    setIsDirty(true)
  }

  const handleCopy = () => {
    console.log('Content copied to clipboard')
  }

  const handleSnapshotSelect = (index: number) => {
    console.log('Snapshot selected:', index)
    jumpTo(index)
  }

  const handleTimelinePositionChange = (position: number) => {
    console.log('Timeline position changed:', position)
    jumpTo(position)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center px-6 bg-surface">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📝</span>
          <h1 className="text-xl font-bold">Editor Demo</h1>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm text-muted" data-testid="header-snapshot-count">
            Snapshots: {snapshotsCount}
          </span>
          <span className="text-sm text-muted">Time-Travel Enabled</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex h-[calc(100vh-4rem)]">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Stats */}
          <EditorStats />

          {/* Editor Toolbar */}
          <EditorToolbar onClear={handleClear} onCopy={handleCopy} />

          {/* Editor Content */}
          <div className="flex-1 p-4 overflow-hidden">
            <SimpleEditor
              placeholder="Start typing or paste your text here..."
              className="h-full"
            />
          </div>
        </div>

        {/* Sidebar - Snapshots */}
        <aside className="w-80 border-l border-border bg-surface/30 flex flex-col">
          <div className="h-12 border-b border-border flex items-center px-4">
            <h2 className="font-semibold">Snapshots</h2>
            <span className="ml-auto text-xs text-muted">{snapshotsCount}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <SnapshotList
              maxHeight="calc(100% - 48px)"
              showUndoRedo={true}
              showSearch={true}
              showFilter={true}
              onSnapshotSelect={handleSnapshotSelect}
            />
          </div>
        </aside>
      </main>

      {/* Timeline Bar */}
      <footer className="h-20 border-t border-border bg-surface/30">
        <div className="flex items-center justify-between h-full px-4">
          <NavigationControls
            showTooltip={true}
            size="medium"
          />
          <div className="flex-1 mx-4">
            <TimelineSlider
              height={80}
              showCurrentIndicator={true}
              showLabels={false}
              animationDuration={300}
              onPositionChange={handleTimelinePositionChange}
            />
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
