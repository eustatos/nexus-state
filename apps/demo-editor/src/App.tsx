import { useTimeTravel } from '@/hooks/useTimeTravel'
import { SimpleEditor, EditorToolbar } from './components/Editor'
import { SnapshotList } from './components/Snapshots'
import { TimelineSlider, NavigationControls, PlaybackControls } from './components/Timeline'
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
    // jumpTo уже вызван в SnapshotList, здесь просто логирование
  }

  const handleTimelinePositionChange = (position: number) => {
    console.log('Timeline position changed:', position)
    jumpTo(position)
  }

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center px-6 bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📝</span>
          <h1 className="text-lg font-bold">Editor Demo</h1>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-xs text-muted" data-testid="header-snapshot-count">
            Snapshots: {snapshotsCount}
          </span>
          <span className="text-xs text-muted">Time-Travel Enabled</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden min-h-0">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Editor Toolbar with Stats */}
          <EditorToolbar onClear={handleClear} onCopy={handleCopy} showStats={true} />

          {/* Editor Content */}
          <div className="flex-1 p-3 overflow-auto">
            <SimpleEditor
              placeholder="Start typing or paste your text here..."
              className="h-full"
            />
          </div>

          {/* Timeline Bar */}
          <footer className="h-14 border-t border-border bg-surface/30 shrink-0">
            <div className="flex items-center justify-between h-full px-3">
              <div className="flex items-center gap-2">
                <NavigationControls
                  showTooltip={true}
                  size="small"
                />
                <PlaybackControls
                  size="compact"
                  showExtended={true}
                />
              </div>
              <div className="flex-1 mx-3">
                <TimelineSlider
                  height={56}
                  showCurrentIndicator={true}
                  showLabels={false}
                  animationDuration={300}
                  onPositionChange={handleTimelinePositionChange}
                />
              </div>
            </div>
          </footer>
        </div>

        {/* Sidebar - Snapshots */}
        <aside className="w-80 border-l border-border bg-surface/30 flex flex-col shrink-0 h-full min-h-0">
          <div className="h-10 border-b border-border flex items-center px-4 shrink-0">
            <h2 className="font-semibold text-sm">Snapshots</h2>
            <span className="ml-auto text-xs text-muted">{snapshotsCount}</span>
          </div>
          <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
            <SnapshotList
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              showUndoRedo={true}
              showSearch={true}
              showFilter={true}
              onSnapshotSelect={handleSnapshotSelect}
            />
          </div>
        </aside>
      </main>
    </div>
  )
}

export default App
