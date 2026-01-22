// DevTools plugin for nexus-state
import { Store } from '@nexus-state/core';

type DevToolsConfig = {
  name?: string;
};

export function devTools(config: DevToolsConfig = {}): (store: Store) => void {
  return (store: Store) => {
    // Проверяем, доступны ли Redux DevTools
    if (typeof window === 'undefined' || !window.__REDUX_DEVTOOLS_EXTENSION__) {
      console.warn('Redux DevTools are not available');
      return;
    }

    const { name = 'nexus-state' } = config;
    
    // Создаем соединение с DevTools
    const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({ name });
    
    // Подписываемся на изменения в хранилище
    store.subscribe(() => {
      const state = store.getState();
      devTools.send('STATE_CHANGE', state);
    });

    // Обрабатываем действия из DevTools (например, time travel)
    devTools.subscribe((message: any) => {
      if (message.type === 'DISPATCH' && message.payload?.type === 'JUMP_TO_ACTION') {
        // Здесь должна быть логика для восстановления состояния
        // Поскольку у нас нет прямого доступа к внутреннему состоянию атомов,
        // мы не можем полностью реализовать time travel без изменений в ядре
        console.warn('Time travel is not fully supported without core modifications');
      }
    });
  };
}