# Фаза 3: Рефакторинг @nexus-state/core

## Цель
Очистить core от time-travel функциональности, уменьшить размер с 3.9 MB до ~500 KB.

## Оценка времени
1 день

## Задачи

### 3.1 Удаление time-travel кода
- [ ] Удалить директорию `src/time-travel/`
- [ ] Удалить все импорты time-travel из других модулей
- [ ] Проверить отсутствие оставшихся ссылок на time-travel

### 3.2 Создание re-exports для backward compatibility
- [ ] Создать `src/time-travel-compat.ts` с deprecated re-exports
- [ ] Добавить экспорт в `src/index.ts` с deprecation warning
- [ ] Добавить JSDoc комментарии о миграции
- [ ] Настроить TypeScript для показа deprecation warnings

### 3.3 Обновление package.json
- [ ] Удалить time-travel из exports
- [ ] Добавить `@nexus-state/time-travel` как optional peer dependency
- [ ] Обновить версию пакета
- [ ] Обновить описание пакета

### 3.4 Обновление utils
- [ ] Проверить что snapshot-serialization экспортируется корректно
- [ ] Убедиться что базовые утилиты остались
- [ ] Проверить размер utils модуля

### 3.5 Обновление тестов
- [ ] Удалить тесты time-travel
- [ ] Обновить оставшиеся тесты
- [ ] Запустить все тесты core
- [ ] Исправить failing тесты

### 3.6 Обновление документации
- [ ] Обновить `README.md`
- [ ] Добавить информацию о новых пакетах
- [ ] Создать migration guide
- [ ] Обновить примеры использования
- [ ] Обновить `CHANGELOG.md`

### 3.7 Сборка и проверка
- [ ] Запустить `pnpm build`
- [ ] Проверить размер bundle (~500 KB)
- [ ] Запустить тесты
- [ ] Проверить TypeScript типы
- [ ] Проверить что re-exports работают
- [ ] Проверить npm pack размер

## Зависимости
Нет новых зависимостей

## Результат
Чистый `@nexus-state/core` размером ~500 KB с backward compatibility через re-exports.

## Критерии приёмки
- ✅ Все тесты проходят
- ✅ Размер bundle ≤ 600 KB
- ✅ TypeScript компилируется без ошибок
- ✅ Re-exports работают с deprecation warnings
- ✅ Документация обновлена
- ✅ CHANGELOG обновлён
