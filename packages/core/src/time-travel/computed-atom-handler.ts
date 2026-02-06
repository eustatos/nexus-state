/**
 * ComputedAtomHandler - Класс для обработки вычисляемых атомов при путешествиях во времени
 * 
 * Этот класс отвечает за хранение вычисляемых значений в снимках,
 * определение необходимости пересчета после восстановления
 * и обработку циклических зависимостей.
 */

import { AtomRegistry } from '../atom-registry';

// Интерфейс для хранения информации о вычисляемом атоме
export interface ComputedAtomInfo {
  id: string;
  value: any;
  dependencies: string[];
  isValid: boolean;
}

export class ComputedAtomHandler {
  private atomRegistry: AtomRegistry;
  private computedAtomCache: Map<string, ComputedAtomInfo> = new Map();

  constructor(atomRegistry: AtomRegistry) {
    this.atomRegistry = atomRegistry;
  }

  /**
   * Сохраняет значения вычисляемых атомов
   * @returns Объект с значениями всех вычисляемых атомов
   */
  saveComputedAtomValues(): Record<string, any> {
    const computedValues: Record<string, any> = {};
    
    for (const [atomId, computedAtom] of this.atomRegistry.getAllComputedAtoms()) {
      try {
        // Получаем текущее значение вычисляемого атома
        const value = computedAtom.get();
        computedValues[atomId] = this.serializeValue(value);
      } catch (error) {
        console.error(`Ошибка при сохранении значения вычисляемого атома ${atomId}:`, error);
      }
    }
    
    return computedValues;
  }

  /**
   * Проверяет, нуждается ли вычисляемый атом в пересчете после восстановления
   * @param atomId - ID вычисляемого атома
   * @returns true, если нуждается в пересчете, иначе false
   */
  needsRecomputation(atomId: string): boolean {
    const computedAtom = this.atomRegistry.getComputedAtom(atomId);
    if (!computedAtom) {
      return false;
    }
    
    // Проверяем, изменились ли зависимости
    const dependencies = computedAtom.getDependencies();
    const cachedInfo = this.computedAtomCache.get(atomId);
    
    if (!cachedInfo) {
      // Если нет кэшированной информации, пересчитываем
      return true;
    }
    
    // Проверяем каждую зависимость
    for (const depId of dependencies) {
      const depAtom = this.atomRegistry.getAtom(depId) || this.atomRegistry.getComputedAtom(depId);
      if (depAtom) {
        const currentValue = depAtom.get();
        const cachedValue = cachedInfo.dependencies.find(d => d === depId);
        if (cachedValue !== currentValue) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Обрабатывает циклические зависимости в восстановлении
   * @param atomIds - Массив ID атомов для проверки
   * @returns true, если циклические зависимости обработаны успешно, иначе false
   */
  handleCircularDependencies(atomIds: string[]): boolean {
    // В реальной реализации здесь будет алгоритм обнаружения циклов
    // и логика их обработки
    
    // Пока что просто возвращаем true
    return true;
  }

  /**
   * Проверяет согласованность вычисляемых атомов
   * @returns true, если все вычисляемые атомы согласованы, иначе false
   */
  validateComputedAtoms(): boolean {
    let isValid = true;
    
    for (const [atomId, computedAtom] of this.atomRegistry.getAllComputedAtoms()) {
      try {
        // Проверяем, что атом может вычислить свое значение
        computedAtom.get();
      } catch (error) {
        console.error(`Вычисляемый атом ${atomId} не может вычислить значение:`, error);
        isValid = false;
      }
    }
    
    return isValid;
  }

  /**
   * Сериализует значение для хранения в снимке
   * @param value - Значение для сериализации
   * @returns Сериализованное значение
   */
  private serializeValue(value: any): any {
    // В реальной реализации здесь будет более сложная логика сериализации
    // В зависимости от типа значения
    
    // Для простых типов возвращаем как есть
    if (value === null || value === undefined || 
        typeof value === 'string' || typeof value === 'number' || 
        typeof value === 'boolean') {
      return value;
    }
    
    // Для объектов и массивов сериализуем в JSON
    try {
      return '__serialized__' + JSON.stringify(value);
    } catch (error) {
      console.error('Ошибка при сериализации значения:', error);
      return value;
    }
  }

  /**
   * Обновляет кэш информации о вычисляемых атомах
   * @param computedValues - Значения вычисляемых атомов
   */
  updateComputedAtomCache(computedValues: Record<string, any>): void {
    // Очищаем текущий кэш
    this.computedAtomCache.clear();
    
    // Заполняем кэш новыми значениями
    for (const [atomId, value] of Object.entries(computedValues)) {
      const computedAtom = this.atomRegistry.getComputedAtom(atomId);
      if (computedAtom) {
        const info: ComputedAtomInfo = {
          id: atomId,
          value: this.deserializeValue(value),
          dependencies: computedAtom.getDependencies(),
          isValid: true
        };
        this.computedAtomCache.set(atomId, info);
      }
    }
  }

  /**
   * Десериализует значение из снимка
   * @param value - Значение для десериализации
   * @returns Десериализованное значение
   */
  private deserializeValue(value: any): any {
    // В реальной реализации здесь будет более сложная логика десериализации
    if (typeof value === 'string' && value.startsWith('__serialized__')) {
      try {
        return JSON.parse(value.substring(14));
      } catch {
        return value;
      }
    }
    return value;
  }

  /**
   * Получает кэшированную информацию о вычисляемом атоме
   * @param atomId - ID вычисляемого атома
   * @returns Кэшированная информация или undefined
   */
  getComputedAtomInfo(atomId: string): ComputedAtomInfo | undefined {
    return this.computedAtomCache.get(atomId);
  }

  /**
   * Очищает кэш вычисляемых атомов
   */
  clearCache(): void {
    this.computedAtomCache.clear();
  }
}