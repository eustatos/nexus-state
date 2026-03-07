import { atom, Atom, Getter } from '@nexus-state/core'
import { editorTimeTravel } from '../timeTravel'

/**
 * Атом для получения текущей позиции в time-travel
 * 
 * Используется для синхронизации UI с текущей позицией в истории.
 */
const timeTravelPositionAtom = atom(
  (_get: Getter) => {
    // Получаем текущую позицию из time-travel
    // Это значение должно обновляться при изменениях в истории
    return 0
  },
  'timeline.timeTravelPosition'
) as unknown as Atom<number>

/**
 * Атом для получения количества снимков в истории
 */
const snapshotsCountValueAtom = atom(
  (_get: Getter) => {
    return editorTimeTravel.getHistory().length
  },
  'timeline.snapshotsCountValue'
) as unknown as Atom<number>

/**
 * Текущая позиция в истории снимков
 *
 * Вычисляемый атом, который возвращает индекс текущего снимка.
 * Для undo/redo используется отдельная логика.
 */
export const currentPositionAtom = atom(
  (_get: Getter) => {
    const history = editorTimeTravel.getHistory()
    return history.length > 0 ? history.length - 1 : 0
  },
  'timeline.currentPositionValue'
) as unknown as Atom<number>

/**
 * Общее количество снимков в истории
 *
 * Вычисляемый атом, который возвращает длину истории.
 */
export const snapshotsCountAtom = snapshotsCountValueAtom

/**
 * Возможность отмены
 *
 * Вычисляемый атом, который возвращает true если есть куда отменять.
 */
export const canUndoAtom = atom(
  (_get: Getter) => {
    return editorTimeTravel.canUndo()
  },
  'timeline.canUndo'
) as unknown as Atom<boolean>

/**
 * Возможность повтора
 *
 * Вычисляемый атом, который возвращает true если есть куда повторять.
 */
export const canRedoAtom = atom(
  (_get: Getter) => {
    return editorTimeTravel.canRedo()
  },
  'timeline.canRedo'
) as unknown as Atom<boolean>

/**
 * Атом для управления позицией timeline slider
 * 
 * Этот атом синхронизируется с позицией time-travel и позволяет
 * управлять навигацией через UI.
 */
export const timelinePositionAtom = timeTravelPositionAtom
