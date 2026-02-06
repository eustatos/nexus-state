/**
 * StateRestorer - Класс для восстановления состояния из снимков
 * 
 * Этот класс отвечает за восстановление состояния хранилища
 * из снимков, валидацию целостности восстановленного состояния
 * и пересчет производных атомов после восстановления.
 */

import { AtomRegistry } from '../atom-registry';
import { StateSnapshot } from './state-snapshot';
import { ComputedAtomHandler } from './computed-atom-handler';

export class StateRestorer {
  private atomRegistry: AtomRegistry;
  private computedAtomHandler: ComputedAtomHandler;

  constructor(atomRegistry: AtomRegistry) {
    this.atomRegistry = atomRegistry;
    this.computedAtomHandler = new ComputedAtomHandler(atomRegistry);
  }

  /**
   * Восстанавливает состояние из снимка
   * @param snapshot - Снимок состояния для восстановления
   * @returns true, если восстановление успешно, иначе false
   */
  restoreFromSnapshot(snapshot: StateSnapshot): boolean {
    try {
      // Проверяем целостность снимка
      if (!this.validateSnapshot(snapshot)) {
        console.error('Недействительный снимок состояния');
        return false;
      }

      // Восстанавливаем значения атомов
      this.restoreAtomValues(snapshot.state);

      // Восстанавливаем значения вычисляемых атомов
      this.restoreComputedAtomValues(snapshot.computedValues);

      // Пересчитываем производные атомы
      this.recomputeDerivedAtoms();

      // Проверяем целостность восстановленного состояния
      if (!this.validateRestoredState()) {
        console.error('Восстановленное состояние не прошло валидацию');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Ошибка при восстановлении состояния:', error);
      return false;
    }
  }

  /**
   * Проверяет целостность снимка
   * @param snapshot - Снимок для проверки
   * @returns true, если снимок действителен, иначе false
   */
  private validateSnapshot(snapshot: StateSnapshot): boolean {
    // Проверяем наличие обязательных полей
    if (!snapshot.id || !snapshot.state || !snapshot.metadata) {
      return false;
    }

    // Проверяем, что реестр атомов соответствует снимку
    const atomRegistryAtoms = this.atomRegistry.getAllAtomIds();
    const snapshotAtoms = Object.keys(snapshot.state);
    
    // Проверяем наличие всех атомов из снимка в реестре
    for (const atomId of snapshotAtoms) {
      if (!atomRegistryAtoms.includes(atomId)) {
        console.warn(`Атом с ID ${atomId} отсутствует в реестре`);
        // Не возвращаем false, так как это может быть нормально для некоторых случаев
      }
    }

    return true;
  }

  /**
   * Восстанавливает значения атомов из снимка
   * @param state - Состояние атомов из снимка
   */
  private restoreAtomValues(state: Record<string, any>): void {
    for (const [atomId, value] of Object.entries(state)) {
      const atom = this.atomRegistry.getAtom(atomId);
      if (atom) {
        // Десериализуем значение перед восстановлением
        const deserializedValue = this.deserializeValue(value);
        atom.set(deserializedValue);
      }
    }
  }

  /**
   * Восстанавливает значения вычисляемых атомов из снимка
   * @param computedValues - Значения вычисляемых атомов из снимка
   */
  private restoreComputedAtomValues(computedValues: Record<string, any>): void {
    for (const [atomId, value] of Object.entries(computedValues)) {
      const computedAtom = this.atomRegistry.getComputedAtom(atomId);
      if (computedAtom) {
        // Десериализуем значение перед восстановлением
        const deserializedValue = this.deserializeValue(value);
        // Для вычисляемых атомов мы устанавливаем кэшированное значение
        computedAtom.setCachedValue(deserializedValue);
      }
    }
  }

  /**
   * Десериализует значение
   * @param value - Значение для десериализации
   * @returns Десериализованное значение
   */
  private deserializeValue(value: any): any {
    // В реальной реализации здесь будет более сложная логика десериализации
    // В зависимости от типа значения
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
   * Пересчитывает производные атомы после восстановления
   */
  private recomputeDerivedAtoms(): void {
    // Сбрасываем кэши вычисляемых атомов, чтобы они пересчитались при следующем доступе
    for (const [, computedAtom] of this.atomRegistry.getAllComputedAtoms()) {
      computedAtom.invalidateCache();
    }
  }

  /**
   * Проверяет целостность восстановленного состояния
   * @returns true, если состояние целостно, иначе false
   */
  private validateRestoredState(): boolean {
    // В реальной реализации здесь будет более сложная логика валидации
    // Проверяем, что все атомы имеют допустимые значения
    for (const [atomId, atom] of this.atomRegistry.getAllAtoms()) {
      try {
        atom.get(); // Пытаемся получить значение, чтобы проверить его корректность
      } catch (error) {
        console.error(`Ошибка при проверке атома ${atomId}:`, error);
        return false;
      }
    }

    return true;
  }

  /**
   * Обрабатывает несоответствия версий между снимком и текущим состоянием
   * @param snapshot - Снимок состояния
   * @returns true, если несоответствия обработаны успешно, иначе false
   */
  handleVersionMismatch(snapshot: StateSnapshot): boolean {
    // В реальной реализации здесь будет логика обработки несоответствий версий
    // Например, миграция данных или преобразование формата
    
    const currentVersion = '1.0.0'; // Текущая версия приложения
    const snapshotVersion = snapshot.metadata.version;
    
    if (snapshotVersion !== currentVersion) {
      console.warn(`Несоответствие версий: снимок v${snapshotVersion}, текущая v${currentVersion}`);
      // Здесь может быть логика миграции
    }
    
    return true;
  }
}