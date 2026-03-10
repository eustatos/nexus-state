import { useState, useCallback } from 'react'
import type { Snapshot } from '@nexus-state/core'
import type { SnapshotMetadata } from '@/store/helpers'
import { useSnapshots } from '@/hooks/useSnapshots'
import { SnapshotItem } from './SnapshotItem'
import { Search, Filter, Undo2, Redo2, ChevronRight, GitCompare, X, Download, Upload } from 'lucide-react'
import { ExportModal } from '@/components/Export/ExportModal'
import { ImportModal } from '@/components/Export/ImportModal'
import './SnapshotList.css'

export interface SnapshotListProps {
  /** Class for customization */
  className?: string
  /** Maximum list height */
  maxHeight?: string
  /** Show undo/redo buttons */
  showUndoRedo?: boolean
  /** Show search */
  showSearch?: boolean
  /** Show filter */
  showFilter?: boolean
  /** Snapshot select handler */
  onSnapshotSelect?: (index: number) => void
  /** Show compare button */
  showCompare?: boolean
  /** Compare mode change handler */
  onCompareModeChange?: (isCompareMode: boolean) => void
  /** Show export/import buttons */
  showExportImport?: boolean
}

type ExtendedSnapshot = Snapshot & { metadata: SnapshotMetadata & { timestamp: number; atomCount: number } }

/**
 * Available action types for filter
 */
const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'text-edit', label: 'Edit' },
  { value: 'paste', label: 'Paste' },
  { value: 'delete', label: 'Delete' },
  { value: 'manual-save', label: 'Manual Save' },
  { value: 'initial', label: 'Initial' }
]

/**
 * Snapshot list component with search and filtering
 *
 * @param props - Component props
 */
export function SnapshotList({
  className = '',
  maxHeight,
  showUndoRedo = true,
  showSearch = true,
  showFilter = true,
  showCompare = true,
  showExportImport = true,
  onSnapshotSelect,
  onCompareModeChange
}: SnapshotListProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([])
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  const {
    filteredSnapshots,
    totalCount,
    currentIndex,
    jumpTo,
    undo,
    redo,
    canUndo,
    canRedo,
    searchQuery,
    setSearchQuery,
    actionFilter,
    setActionFilter
  } = useSnapshots({
    enableSearch: showSearch,
    enableActionFilter: showFilter,
    autoRefresh: true
  })

  // Notify about compare mode change
  const toggleCompareMode = useCallback(() => {
    const newMode = !compareMode
    setCompareMode(newMode)
    setSelectedForCompare([])
    onCompareModeChange?.(newMode)
  }, [compareMode, onCompareModeChange])

  const handleSnapshotClick = useCallback((uiIndex: number) => {
    if (compareMode) {
      // In compare mode - select snapshots for comparison
      setSelectedForCompare(prev => {
        if (prev.includes(uiIndex)) {
          // Already selected - remove selection
          return prev.filter(i => i !== uiIndex)
        } else {
          // Select no more than 2 snapshots
          const newSelection = [...prev, uiIndex].slice(-2)
          return newSelection
        }
      })
    } else {
      // Normal mode - jump to snapshot
      jumpTo(uiIndex)
      onSnapshotSelect?.(uiIndex)
    }
  }, [compareMode, jumpTo, onSnapshotSelect])

  const handleUndo = useCallback(() => {
    undo()
  }, [undo])

  const handleRedo = useCallback(() => {
    redo()
  }, [redo])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [setSearchQuery])

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setActionFilter(e.target.value)
  }, [setActionFilter])

  const handleMouseEnter = useCallback((index: number) => {
    setHoveredIndex(index)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null)
  }, [])

  return (
    <div className={`snapshot-list ${className}`} data-testid="snapshot-list">
      {/* Header with stats */}
      <div className="snapshot-list__header" data-testid="snapshot-list-header">
        <span className="snapshot-list__count" data-testid="snapshot-count">
          {totalCount} snapshot{totalCount !== 1 ? 's' : ''}
        </span>

        <div className="snapshot-list__actions" data-testid="snapshot-undo-redo">
          {/* Export/Import buttons */}
          {showExportImport && (
            <>
              <button
                className="snapshot-list__action-button"
                onClick={() => setShowExportModal(true)}
                title="Export state"
                type="button"
                data-testid="snapshot-export-button"
              >
                <Download size={16} />
              </button>
              <button
                className="snapshot-list__action-button"
                onClick={() => setShowImportModal(true)}
                title="Import state"
                type="button"
                data-testid="snapshot-import-button"
              >
                <Upload size={16} />
              </button>
            </>
          )}

          {/* Compare mode button */}
          {showCompare && (
            <button
              className={`snapshot-list__action-button ${compareMode ? 'active' : ''}`}
              onClick={toggleCompareMode}
              title={compareMode ? 'Exit compare mode' : 'Compare snapshots'}
              type="button"
              data-testid="snapshot-compare-button"
            >
              {compareMode ? <X size={16} /> : <GitCompare size={16} />}
            </button>
          )}

          {showUndoRedo && (
            <>
              <button
                className="snapshot-list__action-button"
                onClick={handleUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                data-testid="snapshot-undo-button"
                type="button"
              >
                <Undo2 size={16} />
              </button>
              <button
                className="snapshot-list__action-button"
                onClick={handleRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                data-testid="snapshot-redo-button"
                type="button"
              >
                <Redo2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Compare mode info */}
      {compareMode && (
        <div className="snapshot-list__compare-info" data-testid="snapshot-compare-info">
          <span className="snapshot-list__compare-info-text">
            Select 2 snapshots to compare
            {selectedForCompare.length > 0 && (
              <span className="snapshot-list__compare-info-count">
                {' '}{selectedForCompare.length}/2 selected
              </span>
            )}
          </span>
          {selectedForCompare.length === 2 && (
            <span className="snapshot-list__compare-info-hint">
              Click on a snapshot to view diff
            </span>
          )}
        </div>
      )}

      {/* Search and Filter */}
      {(showSearch || showFilter) && (
        <div className="snapshot-list__controls" data-testid="snapshot-controls">
          {showSearch && (
            <div className="snapshot-list__search">
              <Search size={14} className="snapshot-list__search-icon" />
              <input
                type="text"
                className="snapshot-list__search-input"
                placeholder="Search snapshots..."
                value={searchQuery}
                onChange={handleSearchChange}
                data-testid="snapshot-search-input"
                aria-label="Search snapshots"
              />
            </div>
          )}

          {showFilter && (
            <div className="snapshot-list__filter">
              <Filter size={14} className="snapshot-list__filter-icon" />
              <select
                className="snapshot-list__filter-select"
                value={actionFilter}
                onChange={handleFilterChange}
                data-testid="snapshot-filter-select"
                aria-label="Filter by action type"
              >
                {ACTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Snapshots list */}
      <div
        className="snapshot-list__items"
        data-testid="snapshot-items-container"
        role="list"
        aria-label="Snapshot history"
      >
        {filteredSnapshots.length === 0 ? (
          <div className="snapshot-list__empty" data-testid="snapshot-empty-state">
            <ChevronRight size={32} className="snapshot-list__empty-icon" />
            <p className="snapshot-list__empty-text">
              {totalCount === 0
                ? 'No snapshots yet'
                : 'No snapshots match your filters'}
            </p>
            <p className="snapshot-list__empty-hint">
              {totalCount === 0
                ? 'Start editing to create snapshots'
                : 'Try adjusting your search or filter'}
            </p>
          </div>
        ) : (
          filteredSnapshots.map((snapshot, uiIndex) => {
            // uiIndex - это индекс в отсортированном списке (0 = самый новый)
            // Для определения текущего снимка нужно сравнить с currentIndex
            // currentIndex - это индекс в истории (0 = самый старый)
            const historyIndex = totalCount - 1 - uiIndex
            const isCurrent = historyIndex === currentIndex
            const isSelectedForCompare = selectedForCompare.includes(uiIndex)

            // Используем комбинацию id и индекса для уникальности ключа
            const uniqueKey = `${snapshot.id}-${historyIndex}-${snapshot.metadata.timestamp}`

            return (
              <SnapshotItem
                key={uniqueKey}
                snapshot={snapshot as ExtendedSnapshot}
                index={uiIndex}
                isCurrent={isCurrent}
                isSelectedForCompare={isSelectedForCompare}
                compareMode={compareMode}
                onClick={handleSnapshotClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
            )
          })
        )}
      </div>

      {/* Footer with hovered info */}
      {hoveredIndex !== null && (
        <div className="snapshot-list__footer" data-testid="snapshot-footer">
          <span className="snapshot-list__footer-text">
            Snapshot #{hoveredIndex + 1} of {totalCount}
          </span>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImportSuccess={({ importedCount }) => {
            setShowImportModal(false)
            // Можно показать уведомление об успехе
            console.log(`Imported ${importedCount} snapshots`)
          }}
        />
      )}
    </div>
  )
}
