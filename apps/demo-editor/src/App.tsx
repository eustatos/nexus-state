import { useTimeTravel } from '@/hooks/useTimeTravel'
import { useStressTest } from '@/hooks/useStressTest'
import { SimpleEditor, EditorToolbar } from './components/Editor'
import { SnapshotList } from './components/Snapshots'
import { TimelineSlider, NavigationControls, PlaybackControls } from './components/Timeline'
import { StressTestControls } from './components/StressTest'
import { ChevronUp, ChevronDown, Zap } from 'lucide-react'
import { useSetAtom } from '@nexus-state/react'
import { contentAtom, isDirtyAtom } from '@/store/atoms/editor'
import { editorStore } from '@/store/store'
import { useState } from 'react'
import './App.css'

function App() {
  const setContent = useSetAtom(contentAtom, editorStore)
  const setIsDirty = useSetAtom(isDirtyAtom, editorStore)
  const { snapshotsCount, jumpTo } = useTimeTravel()
  const stressTest = useStressTest()
  const [showStressTest, setShowStressTest] = useState(false)

  const handleClear = () => {
    setContent('')
    setIsDirty(true)
  }

  const handleCopy = () => {
    console.log('Content copied to clipboard')
  }

  const handleSnapshotSelect = (index: number) => {
    console.log('Snapshot selected:', index)
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
          {stressTest.isRunning && (
            <span className="text-xs text-success flex items-center gap-1">
              <Zap size={12} /> Stress Test
            </span>
          )}
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

        {/* Sidebar */}
        <aside className="w-80 border-l border-border bg-surface/30 flex flex-col shrink-0 h-full min-h-0">
          {/* Snapshots Header */}
          <div className="h-10 border-b border-border flex items-center justify-between px-4 shrink-0 bg-surface/50">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm">Snapshots</h2>
              <span className="text-xs text-muted">{snapshotsCount}</span>
            </div>
            <button
              className="text-xs text-muted hover:text-foreground transition-colors"
              onClick={() => setShowStressTest(!showStressTest)}
              title={showStressTest ? 'Hide stress tests' : 'Show stress tests'}
              type="button"
            >
              {showStressTest ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>

          {/* Stress Test Controls (collapsible) */}
          {showStressTest && (
            <div className="border-b border-border shrink-0 animate-in slide-in-from-top duration-200">
              <StressTestControls stressTest={stressTest} />
            </div>
          )}

          {/* Snapshots List - takes remaining space */}
          <div className="flex-1 overflow-hidden min-h-0">
            <SnapshotList
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
