// Тесты для Vue адаптера
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from './index';
import * as vue from 'vue';

// Мокаем vue для тестирования хука
jest.mock('vue', () => ({
  ...jest.requireActual('vue'),
  ref: jest.fn(),
  watchEffect: jest.fn(),
}));

describe('useAtom', () => {
  beforeEach(() => {
    // Сброс моков перед каждым тестом
    jest.clearAllMocks();
  });

  it('should return a ref with the initial value of the atom', () => {
    const store = createStore();
    const testAtom = atom(42);
    
    // Мокаем ref для контроля возвращаемого значения
    const refMock = jest.spyOn(vue, 'ref');
    refMock.mockImplementation((val) => ({ value: val }));
    
    const watchEffectMock = jest.spyOn(vue, 'watchEffect');
    watchEffectMock.mockImplementation((fn) => fn());
    
    const result = useAtom(testAtom, store);
    
    expect(result.value).toBe(42);
  });

  it('should update when the atom value changes', () => {
    const store = createStore();
    const testAtom = atom(0);
    
    // Мокаем ref для контроля возвращаемого значения
    const refMock = jest.spyOn(vue, 'ref');
    refMock.mockImplementation((val) => ({ value: val }));
    
    const watchEffectMock = jest.spyOn(vue, 'watchEffect');
    watchEffectMock.mockImplementation((fn) => fn());
    
    const result = useAtom(testAtom, store);
    
    expect(result.value).toBe(0);
    
    // Изменяем значение атома
    store.set(testAtom, 1);
    
    // Вызываем watchEffect вручную, так как мы замокали его
    watchEffectMock.mock.calls[0][0]();
    
    // Проверяем, что значение обновилось
    // Поскольку мы мокаем ref, нам нужно вручную обновить refValue
    expect(result.value).toBe(1);
  });
});