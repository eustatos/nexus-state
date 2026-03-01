// Используем CommonJS импорты для тестов
/* global describe, beforeEach, afterEach, test, expect */
/* eslint-disable @typescript-eslint/no-var-requires, no-unused-vars */
const { atom, createStore } = require("@nexus-state/core");

describe("Вычисляемые атомы и селективное обновление", () => {
  let store;

  beforeEach(() => {
    // Создаем store БЕЗ devtools для тестирования базовой функциональности
    store = createStore();
  });

  afterEach(() => {
    store = null;
  });

  test("базовые атомы создаются и обновляются корректно", () => {
    const firstNameAtom = atom("John", "firstName");
    const lastNameAtom = atom("Doe", "lastName");
    const ageAtom = atom(30, "age");

    expect(store.get(firstNameAtom)).toBe("John");
    expect(store.get(lastNameAtom)).toBe("Doe");
    expect(store.get(ageAtom)).toBe(30);

    store.set(firstNameAtom, "Alice");
    store.set(ageAtom, 25);

    expect(store.get(firstNameAtom)).toBe("Alice");
    expect(store.get(ageAtom)).toBe(25);
    expect(store.get(lastNameAtom)).toBe("Doe"); // Не изменился
  });

  test("вычисляемые атомы автоматически пересчитываются при изменении зависимостей", () => {
    const firstNameAtom = atom("John", "firstName");
    const lastNameAtom = atom("Doe", "lastName");
    const ageAtom = atom(30, "age");

    const fullNameAtom = atom(
      (get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`,
      "fullName",
    );

    const isAdultAtom = atom((get) => get(ageAtom) >= 18, "isAdult");

    // Начальные значения
    expect(store.get(fullNameAtom)).toBe("John Doe");
    expect(store.get(isAdultAtom)).toBe(true);

    // Изменяем зависимость
    store.set(firstNameAtom, "Alice");
    expect(store.get(fullNameAtom)).toBe("Alice Doe");

    // Изменяем другую зависимость
    store.set(ageAtom, 17);
    expect(store.get(isAdultAtom)).toBe(false);

    // Full name не должен измениться
    expect(store.get(fullNameAtom)).toBe("Alice Doe");
  });

  test("вложенные вычисляемые атомы работают корректно", () => {
    const firstNameAtom = atom("John", "firstName");
    const lastNameAtom = atom("Doe", "lastName");
    const ageAtom = atom(30, "age");
    const isActiveAtom = atom(true, "isActive");

    const fullNameAtom = atom(
      (get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`,
      "fullName",
    );

    const profileSummaryAtom = atom((get) => {
      const name = get(fullNameAtom);
      const age = get(ageAtom);
      const active = get(isActiveAtom);
      return `${name}, ${age} years old, ${active ? "Active" : "Inactive"}`;
    }, "profileSummary");

    // Начальное значение
    expect(store.get(profileSummaryAtom)).toBe(
      "John Doe, 30 years old, Active",
    );

    // Изменяем firstName -> обновляются fullName и profileSummary
    store.set(firstNameAtom, "Alice");
    expect(store.get(profileSummaryAtom)).toBe(
      "Alice Doe, 30 years old, Active",
    );

    // Изменяем age -> обновляется только profileSummary
    store.set(ageAtom, 25);
    expect(store.get(profileSummaryAtom)).toBe(
      "Alice Doe, 25 years old, Active",
    );

    // Изменяем isActive -> обновляется только profileSummary
    store.set(isActiveAtom, false);
    expect(store.get(profileSummaryAtom)).toBe(
      "Alice Doe, 25 years old, Inactive",
    );
  });

  test("валидационные атомы корректно проверяют состояние", () => {
    const firstNameAtom = atom("John", "firstName");
    const lastNameAtom = atom("Doe", "lastName");
    const ageAtom = atom(30, "age");

    const isValidAtom = atom((get) => {
      const age = get(ageAtom);
      const firstName = get(firstNameAtom);
      const lastName = get(lastNameAtom);

      const isAgeValid = age >= 0 && age <= 150;
      const isFirstNameValid = firstName.trim().length > 0;
      const isLastNameValid = lastName.trim().length > 0;

      return isAgeValid && isFirstNameValid && isLastNameValid;
    }, "isValid");

    // Начальное состояние - валидно
    expect(store.get(isValidAtom)).toBe(true);

    // Делаем невалидным firstName
    store.set(firstNameAtom, "");
    expect(store.get(isValidAtom)).toBe(false);

    // Восстанавливаем валидность
    store.set(firstNameAtom, "Alice");
    expect(store.get(isValidAtom)).toBe(true);

    // Делаем невалидным age
    store.set(ageAtom, -5);
    expect(store.get(isValidAtom)).toBe(false);

    // Восстанавливаем валидность age
    store.set(ageAtom, 25);
    expect(store.get(isValidAtom)).toBe(true);
  });

  test("атомы состояния формы корректно отслеживают изменения", () => {
    const firstNameAtom = atom("John", "firstName");
    const lastNameAtom = atom("Doe", "lastName");
    const ageAtom = atom(30, "age");
    const isActiveAtom = atom(true, "isActive");

    const needsUpdateAtom = atom((get) => {
      const firstName = get(firstNameAtom);
      const lastName = get(lastNameAtom);
      const age = get(ageAtom);
      const isActive = get(isActiveAtom);

      return (
        firstName !== "John" ||
        lastName !== "Doe" ||
        age !== 30 ||
        isActive !== true
      );
    }, "needsUpdate");

    // Начальное состояние - нет изменений
    expect(store.get(needsUpdateAtom)).toBe(false);

    // Изменяем одно поле
    store.set(firstNameAtom, "Alice");
    expect(store.get(needsUpdateAtom)).toBe(true);

    // Возвращаем к исходному значению
    store.set(firstNameAtom, "John");
    expect(store.get(needsUpdateAtom)).toBe(false);

    // Изменяем несколько полей
    store.set(firstNameAtom, "Alice");
    store.set(ageAtom, 25);
    expect(store.get(needsUpdateAtom)).toBe(true);

    // Сбрасываем все поля
    store.set(firstNameAtom, "John");
    store.set(ageAtom, 30);
    expect(store.get(needsUpdateAtom)).toBe(false);
  });

  test("batch обновления работают корректно", () => {
    const firstNameAtom = atom("John", "firstName");
    const lastNameAtom = atom("Doe", "lastName");
    const ageAtom = atom(30, "age");

    const fullNameAtom = atom(
      (get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`,
      "fullName",
    );

    // Проверяем, что store поддерживает batch операции
    if (store.startBatch && store.endBatch) {
      const batchId = "test-batch";

      store.startBatch(batchId);

      store.set(firstNameAtom, "Alice");
      store.set(lastNameAtom, "Smith");
      store.set(ageAtom, 25);

      store.endBatch(batchId);

      // Проверяем обновленные значения
      expect(store.get(firstNameAtom)).toBe("Alice");
      expect(store.get(lastNameAtom)).toBe("Smith");
      expect(store.get(ageAtom)).toBe(25);
      expect(store.get(fullNameAtom)).toBe("Alice Smith");
    } else {
      // Если batch не поддерживается, делаем обычные обновления
      store.set(firstNameAtom, "Alice");
      store.set(lastNameAtom, "Smith");
      store.set(ageAtom, 25);

      expect(store.get(firstNameAtom)).toBe("Alice");
      expect(store.get(lastNameAtom)).toBe("Smith");
      expect(store.get(ageAtom)).toBe(25);
      expect(store.get(fullNameAtom)).toBe("Alice Smith");
    }
  });

  test("селективное обновление минимизирует пересчеты", () => {
    // Создаем атомы с счетчиками вычислений
    let computeCount = 0;
    void computeCount; // eslint-disable-line no-unused-vars

    const dependencyAtom = atom(1, "dependency");

    const computedAtom = atom((get) => {
      computeCount++;
      return get(dependencyAtom) * 2;
    }, "computed");

    const anotherAtom = atom(100, "another");

    // Первое чтение
    expect(store.get(computedAtom)).toBe(2);
    expect(computeCount).toBe(1);

    // Изменяем несвязанный атом
    store.set(anotherAtom, 200);

    // Читаем computedAtom - не должно пересчитываться
    expect(store.get(computedAtom)).toBe(2);
    expect(computeCount).toBe(1); // Не изменилось

    // Изменяем зависимость
    store.set(dependencyAtom, 3);

    // Читаем computedAtom - должно пересчитаться
    expect(store.get(computedAtom)).toBe(6);
    expect(computeCount).toBe(2); // Увеличилось

    // Множественные чтения без изменений
    expect(store.get(computedAtom)).toBe(6);
    expect(store.get(computedAtom)).toBe(6);
    expect(store.get(computedAtom)).toBe(6);

    // Счетчик не должен увеличиваться
    expect(computeCount).toBe(2);
  });
});
