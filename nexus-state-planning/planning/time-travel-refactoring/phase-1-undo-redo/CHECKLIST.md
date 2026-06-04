# Checklist: Фаза 1 - Создание @nexus-state/undo-redo

## 1.1 Создание структуры пакета
- [ ] Создать `packages/undo-redo/`
- [ ] Создать `packages/undo-redo/package.json`
- [ ] Создать `packages/undo-redo/tsconfig.json`
- [ ] Создать `packages/undo-redo/src/`
- [ ] Создать `packages/undo-redo/README.md`
- [ ] Создать `packages/undo-redo/CHANGELOG.md`

## 1.2 Базовый функционал
- [ ] `src/types.ts` - базовые типы
- [ ] `src/UndoRedoStack.ts` - стек истории
- [ ] `src/UndoRedoManager.ts` - менеджер операций
- [ ] `src/index.ts` - главный экспорт

## 1.3 Дополнительные возможности
- [ ] `src/BatchOperations.ts` - группировка операций
- [ ] `src/Debounce.ts` - debounce
- [ ] `src/KeyboardShortcuts.ts` - горячие клавиши
- [ ] `src/EventEmitter.ts` - события

## 1.4 Интеграция с core
- [ ] `src/integration/StoreIntegration.ts`
- [ ] `src/integration/withUndoRedo.ts`
- [ ] Примеры использования

## 1.5 Тесты
- [ ] `src/__tests__/UndoRedoStack.test.ts`
- [ ] `src/__tests__/UndoRedoManager.test.ts`
- [ ] `src/__tests__/BatchOperations.test.ts`
- [ ] `src/__tests__/Debounce.test.ts`
- [ ] `src/__tests__/KeyboardShortcuts.test.ts`
- [ ] `src/__tests__/integration.test.ts`

## 1.6 Документация
- [ ] README.md с примерами
- [ ] API документация
- [ ] Примеры для форм
- [ ] Примеры для редакторов

## 1.7 Финальная проверка
- [ ] `pnpm build`
- [ ] Проверка размера (~150 KB)
- [ ] `pnpm test`
- [ ] TypeScript проверка
- [ ] Tree-shaking проверка
