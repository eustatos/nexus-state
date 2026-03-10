import { useTimeTravel } from '@/hooks/useTimeTravel'
import { useStressTest } from '@/hooks/useStressTest'
import { SimpleEditor, EditorToolbar } from './components/Editor'
import { SnapshotList } from './components/Snapshots'
import { SnapshotDiff } from './components/Snapshots/SnapshotDiff'
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
  const { snapshotsCount, jumpTo, getHistory } = useTimeTravel()
  const stressTest = useStressTest()
  const [showStressTest, setShowStressTest] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([])

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

  const handleCompareModeChange = (isCompareMode: boolean) => {
    console.log('Compare mode changed:', isCompareMode)
    if (!isCompareMode) {
      setShowDiff(false) // Close diff when exiting compare mode
      setSelectedForCompare([]) // Clear selection
    }
  }

  const handleSnapshotSelectWithCompare = (index: number) => {
    console.log('Snapshot selected:', index)
    handleSnapshotSelect(index)
    
    // Track selected snapshots for compare
    setSelectedForCompare(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index) // Deselect
      } else {
        const newSelection = [...prev, index].slice(-2) // Select max 2
        if (newSelection.length === 2) {
          setShowDiff(true) // Open diff when 2 selected
        }
        return newSelection
      }
    })
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
              showCompare={true}
              onSnapshotSelect={handleSnapshotSelectWithCompare}
              onCompareModeChange={handleCompareModeChange}
              onDiffOpen={(selectedIndices) => {
                // Save selected indices and open diff
                setSelectedForCompare(selectedIndices)
                setShowDiff(true)
                console.log('[App] Opening diff with indices:', selectedIndices)
              }}
            />
          </div>
        </aside>
      </main>

      {/* Snapshot Diff Modal */}
      {showDiff && selectedForCompare.length === 2 && (
        <SnapshotDiffWithSnapshots
          baselineIndex={selectedForCompare[0]}
          comparisonIndex={selectedForCompare[1]}
          getHistory={getHistory}
          onClose={() => {
            setShowDiff(false)
            setSelectedForCompare([])
          }}
          showStats={true}
          showModeSwitch={true}
          showSnapshotInfo={true}
        />
      )}
    </div>
  )
}

// Wrapper component to pass snapshots to SnapshotDiff
function SnapshotDiffWithSnapshots({
  baselineIndex,
  comparisonIndex,
  getHistory,
  onClose,
  showStats,
  showModeSwitch,
  showSnapshotInfo
}: {
  baselineIndex: number
  comparisonIndex: number
  getHistory: () => any[]
  onClose: () => void
  showStats?: boolean
  showModeSwitch?: boolean
  showSnapshotInfo?: boolean
}) {
  const history = getHistory()
  console.log('[SnapshotDiffWithSnapshots] History length:', history.length)
  console.log('[SnapshotDiffWithSnapshots] Indices:', baselineIndex, comparisonIndex)
  
  const baseline = history[history.length - 1 - baselineIndex]
  const comparison = history[history.length - 1 - comparisonIndex]
  
  console.log('[SnapshotDiffWithSnapshots] Baseline:', baseline)
  console.log('[SnapshotDiffWithSnapshots] Comparison:', comparison)

  if (!baseline || !comparison) {
    return (
      <div style={{ padding: 20, color: 'red' }}>
        <h3>Error: Snapshots not found</h3>
        <p>History length: {history.length}</p>
        <p>Baseline index: {baselineIndex}</p>
        <p>Comparison index: {comparisonIndex}</p>
        <p>Baseline: {baseline ? 'OK' : 'NOT FOUND'}</p>
        <p>Comparison: {comparison ? 'OK' : 'NOT FOUND'}</p>
        <button onClick={onClose}>Close</button>
      </div>
    )
  }

  return (
    <SnapshotDiff
      onClose={onClose}
      showStats={showStats}
      showModeSwitch={showModeSwitch}
      showSnapshotInfo={showSnapshotInfo}
      baseline={baseline}
      comparison={comparison}
    />
  )
}

export default App
