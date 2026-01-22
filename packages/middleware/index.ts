// Middleware plugin for nexus-state
import { Atom, Store } from '@nexus-state/core';

type MiddlewareConfig<T> = {
  beforeSet?: (atom: Atom<T>, newValue: T) => T | void;
  afterSet?: (atom: Atom<T>, newValue: T) => void;
};

export function middleware<T>(atom: Atom<T>, config: MiddlewareConfig<T>): (store: Store) => void {
  return (store: Store) => {
    const { beforeSet, afterSet } = config;
    
    // Расширяем функциональность store для поддержки middleware
    const originalSet = store.set.bind(store);
    
    store.set = (a: Atom<any>, value: any) => {
      if (a === atom) {
        // Применяем beforeSet middleware
        let processedValue = value;
        if (beforeSet) {
          const result = beforeSet(a as Atom<T>, value);
          if (result !== undefined) {
            processedValue = result;
          }
        }
        
        // Устанавливаем значение
        originalSet(a, processedValue);
        
        // Применяем afterSet middleware
        if (afterSet) {
          afterSet(a as Atom<T>, processedValue);
        }
      } else {
        // Для других атомов используем оригинальную реализацию
        originalSet(a, value);
      }
    };
  };
}