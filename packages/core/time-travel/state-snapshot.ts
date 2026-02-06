/**
 * StateSnapshot - Класс для создания и управления снимками состояния
 * 
 * Этот класс отвечает за захват полного состояния хранилища,
 * эффективное хранение с использованием структурного совместного использования,
 * и автоматическую очистку старых снимков.
 */

import { AtomRegistry } from '../atom-registry';
import { SerializationUtils } from '../utils/serialization';

// Интерфейс для метаданных снимка
export interface SnapshotMetadata {
  timestamp: number;
  actionName?: string;
  stackTrace?: string;
  version: string;
}

// Интерфейс для снимка состояния
export interface StateSnapshot {
  id: string;
  state: Record<string, any>;
  computedValues: Record<string, any>;
  metadata: SnapshotMetadata;
}

export class StateSnapshotManager {
  private maxHistoryLength: number;
  private snapshots: StateSnapshot[] = [];
  private atomRegistry: AtomRegistry;
  private serializationUtils: SerializationUtils;

  constructor(atomRegistry: AtomRegistry, options: { maxHistoryLength?: number } = {}) {
    this.atomRegistry = atomRegistry;
    this.maxHistoryLength = options.maxHistoryLength || 50;
    this.serializationUtils = new SerializationUtils();
  }

  /**
   * Создает снимок текущего состояния
   * @param actionName - Имя действия, вызвавшего изменение состояния
   * @param stackTrace - Трассировка стека (опционально)
   * @returns Созданный снимок состояния
   */
  createSnapshot(actionName?: string, stackTrace?: string): StateSnapshot {
    // Получаем текущее состояние всех атомов
    const state: Record<string, any> = {};
    const computedValues: Record<string, any> = {};
    
    // Захватываем значения всех атомов
    for (const [atomId, atom] of this.atomRegistry.getAllAtoms()) {
      state[atomId] = this.serializationUtils.serialize(atom.get());
    }
    
    // Захватываем значения всех вычисляемых атомов
    for (const [atomId, atom] of this.atomRegistry.getAllComputedAtoms()) {
      computedValues[atomId] = this.serializationUtils.serialize(atom.get());
    }
    
    // Создаем метаданные снимка
    const metadata: SnapshotMetadata = {
      timestamp: Date.now(),
      actionName,
      stackTrace,
      version: '1.0.0'
    };
    
    // Генерируем уникальный ID для снимка
    const id = this.generateSnapshotId();
    
    const snapshot: StateSnapshot = {
      id,
      state,
      computedValues,
      metadata
    };
    
    // Добавляем снимок в историю
    this.addSnapshot(snapshot);
    
    return snapshot;
  }

  /**
   * Добавляет снимок в историю
   * @param snapshot - Снимок для добавления
   */
  private addSnapshot(snapshot: StateSnapshot): void {
    this.snapshots.push(snapshot);
    
    // Ограничиваем длину истории
    if (this.snapshots.length > this.maxHistoryLength) {
      this.snapshots.shift();
    }
  }

  /**
   * Получает снимок по ID
   * @param id - ID снимка
   * @returns Снимок состояния или undefined, если не найден
   */
  getSnapshotById(id: string): StateSnapshot | undefined {
    return this.snapshots.find(snapshot => snapshot.id === id);
  }

  /**
   * Получает все снимки
   * @returns Массив всех снимков
   */
  getAllSnapshots(): StateSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Очищает историю снимков
   */
  clearSnapshots(): void {
    this.snapshots = [];
  }

  /**
   * Генерирует уникальный ID для снимка
   * @returns Уникальный ID
   */
  private generateSnapshotId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Получает максимальную длину истории
   * @returns Максимальная длина истории
   */
  getMaxHistoryLength(): number {
    return this.maxHistoryLength;
  }

  /**
   * Устанавливает максимальную длину истории
   * @param length - Новая максимальная длина истории
   */
  setMaxHistoryLength(length: number): void {
    this.maxHistoryLength = length;
    
    // Если новая длина меньше текущей истории, обрезаем историю
    if (this.snapshots.length > this.maxHistoryLength) {
      this.snapshots = this.snapshots.slice(-this.maxHistoryLength);
    }
  }
}