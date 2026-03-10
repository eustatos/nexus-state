/**
 * Time Travel API module.
 * 
 * Provides interfaces for different aspects of the time travel system:
 * - ICaptureManager: snapshot creation management
 * - IHistoryNavigation: history navigation
 * - IHistoryQuery: history queries
 * - ITimeTravelControl: process control
 * - ISnapshotComparison: snapshot comparison
 */

export {
  ICaptureManager,
  IHistoryNavigation,
  IHistoryQuery,
  ITimeTravelControl,
  ISnapshotComparison,
  TimeTravelFullAPI,
} from './types';
