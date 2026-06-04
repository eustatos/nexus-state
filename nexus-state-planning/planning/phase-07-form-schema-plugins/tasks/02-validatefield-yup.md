# Task 02: Реализовать validateField для Yup Plugin

**Приоритет:** Medium  
**Оценка:** 1 день  
**Статус:** Todo

---

## Цель

Использовать `schema.validateAt()` вместо возврата `null` в `validateField` для Yup plugin.

---

## Проблема

Текущая реализация:
```typescript
validateField: async () => {
  // Note: validateField receives field context, but Yup's validateAt
  // requires all values. This is a limitation - we return null and
  // rely on full validate() for proper validation.
  return null;
}
```

Yup поддерживает `validateAt(path, value)` для валидации отдельного поля.

---

## Решение

```typescript
validateField: async <K extends keyof Record<string, unknown>>(
  fieldName: K,
  value: Record<string, unknown>[K],
  context?: ValidationContext
): Promise<FieldError | null> => {
  try {
    // Yup validateAt требует полный объект значений
    // Создаём временный объект с текущим значением
    const tempValues = { [fieldName]: value };
    
    await schema.validateAt(fieldName as string, tempValues, {
      abortEarly: true,
      stripUnknown: true,
    });
    
    return null;
  } catch (error) {
    if (error instanceof ValidationError) {
      return yupErrorToFieldError(error);
    }
    throw error;
  }
}
```

---

## Scope

1. Обновить `validateField` в `packages/form-schema-yup/src/index.ts`
2. Добавить тесты для `validateField`:
   - Валидация одного поля
   - Ошибка валидации
   - Cross-field validation (должен работать с полным контекстом)
3. Обновить комментарии в коде
4. Обновить README с примером использования

---

## Acceptance Criteria

- [ ] `validateField` использует `schema.validateAt()`
- [ ] Тесты покрывают все сценарии
- [ ] Документация обновлена
- [ ] Backward compatibility сохранена

---

## Dependencies

- Task 01 (Documentation)

---

## Notes

- Yup `validateAt` требует полный объект, но мы можем создать временный
- Для cross-field validation всё равно нужен полный `validate()`
- Это улучшение производительности для простых полей
