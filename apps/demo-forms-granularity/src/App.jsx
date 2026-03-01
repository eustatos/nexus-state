import React, { useMemo, useCallback } from "react";
import { atom, createStore } from "@nexus-state/core";
import { useAtom } from "@nexus-state/react";
import { devTools } from "@nexus-state/devtools";

// Создаем store для изоляции состояния формы с DevTools
const formStore = createStore();
const devtoolsPlugin = devTools();
devtoolsPlugin.apply(formStore);

// Атомы для базовых значений полей - тоже вне хука
const ageValueAtom = atom(0, "ageValue");
const controlValueAtom = atom(0, "controlValue");

// Вспомогательные атомы для четности контрольного значения
const isControlEvenAtom = atom((get) => {
  const controlValue = get(controlValueAtom);
  const numValue = parseInt(controlValue);
  return numValue % 2 === 0;
}, "isControlEven");
// Атом для вычисления правила валидации
const ageValidationRuleAtom = atom((get) => {
  const isEven = get(isControlEvenAtom);
  const controlValue = get(controlValueAtom);

  if (isEven) {
    return {
      minAge: 18,
      ruleDescription: `D = ${controlValue} (четное) → возраст ≥ 18`,
      errorMessage: "Возраст должен быть ≥ 18 лет, так как D четное",
    };
  } else {
    return {
      minAge: 21,
      ruleDescription: `D = ${controlValue} (нечетное) → возраст ≥ 21`,
      errorMessage: "Возраст должен быть ≥ 21 лет, так как D нечетное",
    };
  }
}, "ageValidationRule");
// Атом для проверки валидности возраста
const isAgeValidAtom = atom((get) => {
  const ageStr = get(ageValueAtom);
  const age = parseInt(ageStr);
  const rule = get(ageValidationRuleAtom);

  if (ageStr === "" || isNaN(age)) {
    return { isValid: false, error: "Введите корректный возраст" };
  }

  const isValid = age >= rule.minAge;
  return {
    isValid,
    error: isValid ? null : rule.errorMessage,
  };
}, "isAgeValid");
// Атом для проверки валидности контрольного значения
const isControlValidAtom = atom((get) => {
  const controlStr = get(controlValueAtom);
  const controlValue = parseInt(controlStr);

  if (controlStr === "" || isNaN(controlValue)) {
    return { isValid: false, error: "Введите корректное число" };
  }

  return { isValid: true, error: null };
}, "isControlValid");
// Атом для общей валидности формы
const isFormValidAtom = atom((get) => {
  const ageValidation = get(isAgeValidAtom);
  const controlValidation = get(isControlValidAtom);

  return ageValidation.isValid && controlValidation.isValid;
}, "isFormValid");
// Атомы для отслеживания touched состояний
const ageTouchedAtom = atom(false, "ageTouched");
const controlTouchedAtom = atom(false, "controlTouched");

// Хук для управления полем с валидацией
const useField = (valueAtom, touchedAtom, validationAtom, fieldName) => {
  const [value, setValue] = useAtom(valueAtom, formStore);
  const [touched, setTouched] = useAtom(touchedAtom, formStore);
  const [validationResult] = useAtom(validationAtom, formStore);

  const handleChange = useCallback(
    (newValue) => {
      setValue(newValue);
      if (!touched) {
        setTouched(true);
      }
    },
    [setValue, touched, setTouched],
  );

  const handleBlur = useCallback(() => {
    if (!touched) {
      setTouched(true);
    }
  }, [touched, setTouched]);

  const showError = useMemo(
    () => touched && !validationResult.isValid,
    [touched, validationResult.isValid],
  );

  const errorMessage = useMemo(
    () => (showError ? validationResult.error : null),
    [showError, validationResult.error],
  );

  return useMemo(
    () => ({
      value,
      touched,
      validation: validationResult,
      showError,
      errorMessage,
      handleChange,
      handleBlur,
      setTouched,
      fieldName,
    }),
    [
      value,
      touched,
      validationResult,
      showError,
      errorMessage,
      handleChange,
      handleBlur,
      setTouched,
      fieldName,
    ],
  );
};

// Вспомогательная функция для получения значения атома
const useAtomValue = (atom, store) => {
  const [value] = useAtom(atom, store);
  return value;
};

// Компонент поля формы
const Field = React.memo(
  ({ label, field, type = "number", placeholder, description }) => {
    const fieldStyle = useMemo(
      () => ({
        width: "100%",
        padding: "12px",
        border: field.showError ? "2px solid #ff6b6b" : "1px solid #ddd",
        borderRadius: "6px",
        fontSize: "16px",
        backgroundColor: field.showError ? "#fff8f8" : "white",
      }),
      [field.showError],
    );

    const errorStyle = useMemo(
      () => ({
        color: "#ff6b6b",
        fontSize: "14px",
        marginTop: "6px",
        padding: "8px",
        backgroundColor: "#fff8f8",
        borderRadius: "4px",
      }),
      [],
    );

    const successStyle = useMemo(
      () => ({
        color: "#2ecc71",
        fontSize: "14px",
        marginTop: "6px",
      }),
      [],
    );

    const showSuccess = useMemo(
      () =>
        field.touched &&
        !field.showError &&
        field.value !== "" &&
        field.value !== "0",
      [field.touched, field.showError, field.value],
    );

    return (
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "8px" }}>
          <strong>{label}</strong>
        </label>
        {description && (
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
            {description}
          </p>
        )}
        <input
          type={type}
          value={field.value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          placeholder={placeholder}
          style={fieldStyle}
        />
        {field.showError && (
          <div style={errorStyle}>❌ {field.errorMessage}</div>
        )}
        {showSuccess && <div style={successStyle}>✓ Корректно</div>}
      </div>
    );
  },
);

// Демонстрационный компонент для отладки
const DebugPanel = React.memo(() => {
  const [age] = useAtom(ageValueAtom, formStore);
  const [control] = useAtom(controlValueAtom, formStore);
  const [isEven] = useAtom(isControlEvenAtom, formStore);
  const [rule] = useAtom(ageValidationRuleAtom, formStore);
  const [ageValidation] = useAtom(isAgeValidAtom, formStore);

  const debugStyle = useMemo(
    () => ({
      marginTop: "20px",
      padding: "15px",
      backgroundColor: "#f5f5f5",
      borderRadius: "8px",
      fontSize: "14px",
    }),
    [],
  );

  return (
    <div style={debugStyle}>
      <h4 style={{ marginTop: 0 }}>🔍 Отладка:</h4>
      <ul style={{ margin: 0, paddingLeft: "20px" }}>
        <li>
          D: {control} (четное: {isEven ? "да" : "нет"})
        </li>
        <li>A: {age}</li>
        <li>Правило: {rule.ruleDescription}</li>
        <li>Требуемый возраст: ≥ {rule.minAge}</li>
        <li>Валидность A: {ageValidation.isValid ? "✅" : "❌"}</li>
        <li>Ошибка: {ageValidation.error || "нет"}</li>
      </ul>
    </div>
  );
});

// Основной компонент формы
export const App = () => {
  // Используем кастомные хуки для полей
  const ageField = useField(
    ageValueAtom,
    ageTouchedAtom,
    isAgeValidAtom,
    "age",
  );
  const controlField = useField(
    controlValueAtom,
    controlTouchedAtom,
    isControlValidAtom,
    "control",
  );

  // Получаем состояние валидационных правил
  const validationRule = useAtomValue(ageValidationRuleAtom, formStore);
  const isFormValid = useAtomValue(isFormValidAtom, formStore);

  // Получаем значения полей для отображения
  const [ageValue] = useAtom(ageValueAtom, formStore);
  const [controlValue] = useAtom(controlValueAtom, formStore);

  // Функция сброса формы
  const resetForm = useCallback(() => {
    ageField.handleChange(0);
    controlField.handleChange(0);
    ageField.setTouched(false);
    controlField.setTouched(false);
  }, [ageField, controlField]);

  // Функция отправки формы
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      // Помечаем все поля как touched
      ageField.setTouched(true);
      controlField.setTouched(true);

      if (isFormValid) {
        alert(
          `Форма отправлена!\nВозраст: ${ageValue}\nКонтрольное значение: ${controlValue}`,
        );
      } else {
        alert("Пожалуйста, исправьте ошибки в форме");
      }
    },
    [ageField, controlField, isFormValid, ageValue, controlValue],
  );

  // Стили для основного контейнера
  const containerStyle = useMemo(
    () => ({
      maxWidth: "800px",
      margin: "0 auto",
      padding: "30px",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }),
    [],
  );

  const headerStyle = useMemo(
    () => ({
      textAlign: "center",
      marginBottom: "40px",
      padding: "20px",
      backgroundColor: "#f8f9fa",
      borderRadius: "10px",
    }),
    [],
  );

  const mainStyle = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "30px",
    }),
    [],
  );

  const formSectionStyle = useMemo(
    () => ({
      padding: "25px",
      backgroundColor: "white",
      borderRadius: "10px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    }),
    [],
  );

  const infoSectionStyle = useMemo(
    () => ({
      padding: "25px",
      backgroundColor: "#f8f9fa",
      borderRadius: "10px",
    }),
    [],
  );

  const formStatusStyle = useMemo(
    () => ({
      marginTop: "30px",
      padding: "20px",
      backgroundColor: isFormValid ? "#e8f6ef" : "#fff8f8",
      border: isFormValid ? "1px solid #2ecc71" : "1px solid #ff6b6b",
      borderRadius: "8px",
    }),
    [isFormValid],
  );

  const submitButtonStyle = useMemo(
    () => ({
      flex: 1,
      padding: "12px 24px",
      backgroundColor: isFormValid ? "#2ecc71" : "#95a5a6",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "16px",
      cursor: isFormValid ? "pointer" : "not-allowed",
      opacity: isFormValid ? 1 : 0.7,
    }),
    [isFormValid],
  );

  const resetButtonStyle = useMemo(
    () => ({
      padding: "12px 24px",
      backgroundColor: "#e74c3c",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "16px",
      cursor: "pointer",
    }),
    [],
  );

  const footerStyle = useMemo(
    () => ({
      marginTop: "40px",
      padding: "20px",
      textAlign: "center",
      color: "#7f8c8d",
      fontSize: "14px",
      borderTop: "1px solid #eee",
    }),
    [],
  );

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={{ margin: 0, color: "#2c3e50" }}>
          🎯 Зависимые валидации с Nexus-State
        </h1>
        <p style={{ color: "#7f8c8d", marginTop: "10px" }}>
          Гранулярный подход с атомами и селекторами
        </p>
      </header>

      <main style={mainStyle}>
        {/* Левая колонка - форма */}
        <section style={formSectionStyle}>
          <h2 style={{ marginTop: 0, color: "#3498db" }}>
            Форма с зависимыми валидациями
          </h2>

          <form onSubmit={handleSubmit}>
            <Field
              label="Контрольное значение (D)"
              field={controlField}
              type="number"
              placeholder="Введите любое число"
              description="Это значение определяет правило для поля Возраст"
            />

            <Field
              label="Возраст (A)"
              field={ageField}
              type="number"
              placeholder={`Минимум ${validationRule.minAge} лет`}
              description={`Требование: ${validationRule.ruleDescription}`}
            />

            {/* Панель отладки */}
            <DebugPanel />

            <div style={formStatusStyle}>
              <h3
                style={{
                  marginTop: 0,
                  color: isFormValid ? "#27ae60" : "#e74c3c",
                }}
              >
                {isFormValid
                  ? "✅ Форма готова к отправке"
                  : "❌ Форма содержит ошибки"}
              </h3>

              <div style={{ marginBottom: "15px" }}>
                <strong>Текущие значения:</strong>
                <ul style={{ margin: "10px 0 0 0", paddingLeft: "20px" }}>
                  <li>
                    Контрольное значение (D): <strong>{controlValue}</strong>
                  </li>
                  <li>
                    Возраст (A): <strong>{ageValue}</strong>
                  </li>
                  <li>
                    Текущее правило:{" "}
                    <strong>{validationRule.ruleDescription}</strong>
                  </li>
                  <li>
                    Минимальный возраст:{" "}
                    <strong>{validationRule.minAge} лет</strong>
                  </li>
                </ul>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  style={submitButtonStyle}
                  disabled={!isFormValid}
                >
                  Отправить форму
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  style={resetButtonStyle}
                >
                  Сбросить
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Правая колонка - информация о гранулярности */}
        <section style={infoSectionStyle}>
          <h2 style={{ marginTop: 0, color: "#2c3e50" }}>
            ✨ Гранулярный подход
          </h2>

          <div style={{ marginBottom: "25px" }}>
            <h3 style={{ color: "#3498db" }}>Преимущества архитектуры:</h3>
            <ul style={{ paddingLeft: "20px" }}>
              <li>
                🎯 <strong>Атомарность</strong> - каждое состояние в отдельном
                атоме
              </li>
              <li>
                ⚡ <strong>Эффективные перерисовки</strong> - компоненты
                обновляются только при изменении зависимостей
              </li>
              <li>
                🧩 <strong>Модульность</strong> - легко добавлять новые
                валидации
              </li>
              <li>
                🔍 <strong>Отладка</strong> - четкое разделение ответственности
              </li>
            </ul>
          </div>

          <div
            style={{
              padding: "15px",
              backgroundColor: "#e8f4fd",
              borderRadius: "6px",
              borderLeft: "4px solid #3498db",
            }}
          >
            <h3 style={{ color: "#2980b9", marginTop: 0 }}>
              🎯 Правила валидации:
            </h3>
            <ol style={{ paddingLeft: "20px" }}>
              <li>
                <strong>Поле D</strong>: должно быть числом
              </li>
              <li>
                <strong>Поле A</strong>: должно быть числом
              </li>
              <li>
                <strong>Если D четное</strong>: A ≥ 18 лет
              </li>
              <li>
                <strong>Если D нечетное</strong>: A ≥ 21 год
              </li>
            </ol>
          </div>

          <div
            style={{
              marginTop: "25px",
              padding: "15px",
              backgroundColor: "#fef9e7",
              borderRadius: "6px",
              borderLeft: "4px solid #f39c12",
            }}
          >
            <h3 style={{ color: "#d68910", marginTop: 0 }}>
              🔄 Связи между атомами:
            </h3>
            <pre
              style={{
                fontSize: "12px",
                backgroundColor: "#2c3e50",
                color: "#ecf0f1",
                padding: "10px",
                borderRadius: "4px",
                overflow: "auto",
              }}
            >
              {`controlValueAtom ──┐
                    ↓
           isControlEvenAtom (селектор)
                    ↓
    ageValidationRuleAtom (селектор)
          │               │
          ↓               ↓
ageValueAtom       isAgeValidAtom (селектор)
          │               │
          └───────┬───────┘
                  ↓
         isFormValidAtom (селектор)`}
            </pre>
          </div>

          <div
            style={{
              marginTop: "25px",
              padding: "15px",
              backgroundColor: "#f9f0ff",
              borderRadius: "6px",
              borderLeft: "4px solid #9b59b6",
            }}
          >
            <h3 style={{ color: "#8e44ad", marginTop: 0 }}>
              🧪 Примеры тестирования:
            </h3>
            <div style={{ fontSize: "14px" }}>
              <p>
                <strong>Тест 1:</strong> D=2 (четное) → A должно быть ≥ 18
              </p>
              <p>
                <strong>Тест 2:</strong> D=3 (нечетное) → A должно быть ≥ 21
              </p>
              <p>
                <strong>Тест 3:</strong> D=4 (четное) → A должно быть ≥ 18
              </p>
              <p>
                <strong>Тест 4:</strong> D=5 (нечетное) → A должно быть ≥ 21
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer style={footerStyle}>
        <p>
          Демонстрация гранулярного управления состоянием с помощью{" "}
          <strong>Nexus-State</strong>
        </p>
      </footer>
    </div>
  );
};

export default App;
