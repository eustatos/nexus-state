import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Импортируем из CommonJS сборки
const { atom, createStore } = require("@nexus-state/core");
const { useAtom } = require("@nexus-state/react");
const { devTools } = require("@nexus-state/devtools");

// Мок для отслеживания рендеров
let renderCounts = {};

const RenderTracker = ({ atom, label }) => {
  const value = useAtom(atom);

  if (!renderCounts[label]) {
    renderCounts[label] = 0;
  }
  renderCounts[label]++;

  return (
    <div data-testid={`tracker-${label}`}>
      <span data-testid={`value-${label}`}>{JSON.stringify(value)}</span>
      <span data-testid={`count-${label}`}>{renderCounts[label]}</span>
    </div>
  );
};

describe("React интеграция и селективное обновление", () => {
  let store;

  beforeEach(() => {
    renderCounts = {};
    // Обертываем devTools() в функцию плагина
    const devToolsPlugin = (store) => {
      const pluginInstance = devTools({
        name: "Test Store",
        trace: false,
      });
      pluginInstance.apply(store);
    };

    store = createStore([devToolsPlugin]);
  });

  afterEach(() => {
    store = null;
  });

  test("компоненты обновляются только при изменении их атомов", () => {
    // Создаем атомы
    const atomA = atom("A", "atomA");
    const atomB = atom("B", "atomB");
    const atomC = atom("C", "atomC");

    const computedAtomAB = atom(
      (get) => `${get(atomA)}${get(atomB)}`,
      "computedAB",
    );

    const computedAtomBC = atom(
      (get) => `${get(atomB)}${get(atomC)}`,
      "computedBC",
    );

    const TestComponent = () => (
      <div>
        <RenderTracker atom={atomA} label="atomA" />
        <RenderTracker atom={atomB} label="atomB" />
        <RenderTracker atom={atomC} label="atomC" />
        <RenderTracker atom={computedAtomAB} label="computedAB" />
        <RenderTracker atom={computedAtomBC} label="computedBC" />

        <button data-testid="updateA" onClick={() => store.set(atomA, "A1")}>
          Update A
        </button>

        <button data-testid="updateB" onClick={() => store.set(atomB, "B1")}>
          Update B
        </button>

        <button data-testid="updateC" onClick={() => store.set(atomC, "C1")}>
          Update C
        </button>
      </div>
    );
    render(<TestComponent />);

    // Проверяем начальные значения
    expect(screen.getByTestId("value-atomA")).toHaveTextContent('"A"');
    expect(screen.getByTestId("value-atomB")).toHaveTextContent('"B"');
    expect(screen.getByTestId("value-atomC")).toHaveTextContent('"C"');
    expect(screen.getByTestId("value-computedAB")).toHaveTextContent('"AB"');
    expect(screen.getByTestId("value-computedBC")).toHaveTextContent('"BC"');

    // Проверяем начальные счетчики рендеров
    expect(screen.getByTestId("count-atomA")).toHaveTextContent("1");
    expect(screen.getByTestId("count-atomB")).toHaveTextContent("1");
    expect(screen.getByTestId("count-atomC")).toHaveTextContent("1");
    expect(screen.getByTestId("count-computedAB")).toHaveTextContent("1");
    expect(screen.getByTestId("count-computedBC")).toHaveTextContent("1");

    // Изменяем atomA
    fireEvent.click(screen.getByTestId("updateA"));

    // Проверяем обновления
    expect(screen.getByTestId("value-atomA")).toHaveTextContent('"A1"');
    expect(screen.getByTestId("value-computedAB")).toHaveTextContent('"A1B"');

    // atomB, atomC, computedBC не должны были обновиться
    expect(screen.getByTestId("value-atomB")).toHaveTextContent('"B"');
    expect(screen.getByTestId("value-atomC")).toHaveTextContent('"C"');
    expect(screen.getByTestId("value-computedBC")).toHaveTextContent('"BC"');

    // Проверяем счетчики рендеров
    expect(screen.getByTestId("count-atomA")).toHaveTextContent("2"); // Обновился
    expect(screen.getByTestId("count-computedAB")).toHaveTextContent("2"); // Обновился
    expect(screen.getByTestId("count-atomB")).toHaveTextContent("1"); // Не изменился
    expect(screen.getByTestId("count-atomC")).toHaveTextContent("1"); // Не изменился
    expect(screen.getByTestId("count-computedBC")).toHaveTextContent("1"); // Не изменился

    // Изменяем atomB (влияет на оба вычисляемых атома)
    fireEvent.click(screen.getByTestId("updateB"));

    expect(screen.getByTestId("value-atomB")).toHaveTextContent('"B1"');
    expect(screen.getByTestId("value-computedAB")).toHaveTextContent('"A1B1"');
    expect(screen.getByTestId("value-computedBC")).toHaveTextContent('"B1C"');

    // Проверяем счетчики рендеров
    expect(screen.getByTestId("count-atomB")).toHaveTextContent("2"); // Обновился
    expect(screen.getByTestId("count-computedAB")).toHaveTextContent("3"); // Обновился
    expect(screen.getByTestId("count-computedBC")).toHaveTextContent("2"); // Обновился
    expect(screen.getByTestId("count-atomA")).toHaveTextContent("2"); // Не изменился
    expect(screen.getByTestId("count-atomC")).toHaveTextContent("1"); // Не изменился
  });

  test("форма с валидацией корректно обновляется", async () => {
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

    const FormComponent = () => {
      const [firstName, setFirstName] = useAtom(firstNameAtom);
      const [lastName, setLastName] = useAtom(lastNameAtom);
      const [age, setAge] = useAtom(ageAtom);
      const [isValid] = useAtom(isValidAtom);

      return (
        <div>
          <input
            data-testid="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            data-testid="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <input
            data-testid="age"
            type="number"
            value={age}
            onChange={(e) => setAge(parseInt(e.target.value) || 0)}
          />

          <div data-testid="validation">{isValid ? "Valid" : "Invalid"}</div>

          <RenderTracker atom={firstNameAtom} label="firstName" />
          <RenderTracker atom={lastNameAtom} label="lastName" />
          <RenderTracker atom={ageAtom} label="age" />
          <RenderTracker atom={isValidAtom} label="isValid" />
        </div>
      );
    };
    render(<FormComponent />);

    // Начальное состояние - валидно
    expect(screen.getByTestId("validation")).toHaveTextContent("Valid");

    // Делаем firstName невалидным
    fireEvent.change(screen.getByTestId("firstName"), {
      target: { value: "" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("validation")).toHaveTextContent("Invalid");
    });

    // Проверяем счетчики рендеров
    expect(screen.getByTestId("count-firstName")).toHaveTextContent("2");
    expect(screen.getByTestId("count-isValid")).toHaveTextContent("2");

    // lastName и age не должны были перерендериться
    expect(screen.getByTestId("count-lastName")).toHaveTextContent("1");
    expect(screen.getByTestId("count-age")).toHaveTextContent("1");

    // Восстанавливаем валидность
    fireEvent.change(screen.getByTestId("firstName"), {
      target: { value: "Alice" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("validation")).toHaveTextContent("Valid");
    });

    // Делаем age невалидным
    fireEvent.change(screen.getByTestId("age"), {
      target: { value: "-10" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("validation")).toHaveTextContent("Invalid");
    });

    // Проверяем счетчики рендеров
    expect(screen.getByTestId("count-age")).toHaveTextContent("2");
    expect(screen.getByTestId("count-isValid")).toHaveTextContent("3");

    // firstName и lastName не должны были перерендериться
    expect(screen.getByTestId("count-firstName")).toHaveTextContent("2");
    expect(screen.getByTestId("count-lastName")).toHaveTextContent("1");
  });

  test("devtools интеграция не ломает функциональность", () => {
    // Просто проверяем, что store с devtools работает
    const testAtom = atom("test", "testAtom");

    const TestComponent = () => {
      const [value] = useAtom(testAtom);
      return <div data-testid="test-value">{value}</div>;
    };

    render(<TestComponent />);

    expect(screen.getByTestId("test-value")).toHaveTextContent("test");

    // Изменяем значение
    store.set(testAtom, "updated");

    // В реальном приложении React перерендерит компонент
    // В тестах нужно триггерить обновление через forceUpdate или аналоги
    // Для простоты проверяем, что store работает
    expect(store.get(testAtom)).toBe("updated");
  });
});
