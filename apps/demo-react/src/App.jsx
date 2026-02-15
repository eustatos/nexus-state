import React, { useState, useEffect } from "react";
import { useAtom } from "@nexus-state/react";
import { atom, createStore } from "@nexus-state/core";
import ComputedAtomsDemo from "./computed-atoms-demo";

// Простой пример счетчика
const countAtom = atom(0, "counter");
const doubleCountAtom = atom((get) => get(countAtom) * 2, "doubleCounter");
const isEvenAtom = atom((get) => get(countAtom) % 2 === 0, "isEven");

// Создаем store без devtools для простого демо
const simpleStore = createStore();

const SimpleCounterDemo = () => {
  const count = useAtom(countAtom, simpleStore);
  const doubleCount = useAtom(doubleCountAtom, simpleStore);
  const isEven = useAtom(isEvenAtom, simpleStore);

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          color: "#333",
          borderBottom: "2px solid #2196F3",
          paddingBottom: "10px",
        }}
      >
        🔢 Nexus State: Simple Counter Demo
      </h1>

      <div
        style={{
          backgroundColor: "#e3f2fd",
          padding: "15px",
          borderRadius: "5px",
          marginBottom: "20px",
          border: "1px solid #bbdefb",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#1565c0" }}>
          💡 Что демонстрируется:
        </h3>
                  <ul style={{ marginBottom: 0 }}>
          <li>
            <strong>Basic atoms</strong> — simple counter
          </li>
          <li>
            <strong>Computed atoms</strong> — doubled value and parity check
            четности
          </li>
          <li>
            <strong>Atomic updates</strong> — React components update only when their atoms change
          </li>
        </ul>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
          marginBottom: "30px",
        }}
      >
        <div>
          <h2 style={{ color: "#2196F3" }}>Счетчик</h2>
          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              textAlign: "center",
              color: "#2196F3",
              margin: "20px 0",
            }}
          >
            {count}
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => simpleStore.set(countAtom, count + 1)}
              style={{
                padding: "12px 24px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              ➕ Increment
            </button>

            <button
              onClick={() => simpleStore.set(countAtom, count - 1)}
              style={{
                padding: "12px 24px",
                backgroundColor: "#FF9800",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              ➖ Decrement
            </button>

            <button
              onClick={() => simpleStore.set(countAtom, 0)}
              style={{
                padding: "12px 24px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              🔄 Reset
            </button>
          </div>
        </div>

        <div>
          <h2 style={{ color: "#9C27B0" }}>Computed values</h2>

          <div
            style={{
              backgroundColor: "#f3e5f5",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <div style={{ marginBottom: "15px" }}>
              <div
                style={{
                  fontSize: "14px",
                  color: "#7B1FA2",
                  marginBottom: "5px",
                }}
              >
                Удвоенное значение:
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#9C27B0",
                }}
              >
                {doubleCount}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#7B1FA2",
                  marginBottom: "5px",
                }}
              >
                Четное число:
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: isEven ? "#4CAF50" : "#FF5722",
                }}
              >
                {isEven ? "✅ Да" : "❌ Нет"}
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#FFF3E0",
              padding: "15px",
              borderRadius: "6px",
              border: "1px solid #FFCC80",
            }}
          >
            <h4 style={{ marginTop: 0, color: "#EF6C00" }}>
              🎯 Примеры для проверки:
            </h4>
            <ul style={{ fontSize: "14px", margin: 0 }}>
              <li>
                Нажмите <strong>Increment</strong> → обновятся все три значения
              </li>
              <li>
                Нажмите <strong>Decrement</strong> → проверьте изменение
                четности
              </li>
              <li>
                Обратите внимание, как React компоненты обновляются селективно
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          backgroundColor: "#E8F5E9",
          borderRadius: "5px",
          border: "1px solid #C8E6C9",
          fontSize: "14px",
          color: "#2E7D32",
        }}
      >
        <strong>ℹ️ Information:</strong> This is a demonstration of basic usage
        of atoms in React. Notice how computed atoms automatically update
        when the counter changes and how React components selectively update.
      </div>
    </div>
  );
};

export const App = () => {
  const [showComputedDemo, setShowComputedDemo] = useState(false);

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "15px 20px",
          borderBottom: "2px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#333" }}>🧪 Nexus State Demos</h2>
          <div style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
            Demonstration of state management library capabilities
          </div>
        </div>

        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowComputedDemo(false)}
              style={{
                padding: "10px 20px",
                backgroundColor: showComputedDemo ? "#fff" : "#2196F3",
                color: showComputedDemo ? "#333" : "#fff",
                border: `2px solid ${showComputedDemo ? "#ccc" : "#2196F3"}`,
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                transition: "all 0.2s",
              }}
            >
              🔢 Simple Counter
            </button>

            <button
              onClick={() => setShowComputedDemo(true)}
              style={{
                padding: "10px 20px",
                backgroundColor: showComputedDemo ? "#4CAF50" : "#fff",
                color: showComputedDemo ? "#fff" : "#333",
                border: `2px solid ${showComputedDemo ? "#4CAF50" : "#ccc"}`,
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                transition: "all 0.2s",
              }}
            >
              🧮 Computed Atoms
            </button>
          </div>
        </div>
      </div>

      {showComputedDemo ? <ComputedAtomsDemo /> : <SimpleCounterDemo />}

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderTop: "1px solid #dee2e6",
          fontSize: "14px",
          color: "#495057",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
          }}
        >
          <div>
            <h4 style={{ marginTop: 0, color: "#2196F3" }}>🧪 Testing</h4>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              <li>
                Run <code>npm test</code> for unit tests
              </li>
              <li>
                Run <code>npm run test:e2e</code> for E2E tests
              </li>
              <li>Check console for errors</li>
            </ul>
          </div>

          <div>
            <h4 style={{ marginTop: 0, color: "#4CAF50" }}>✅ Atomic updates</h4>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              <li>React components update only when their atoms change</li>
              <li>Computed atoms automatically recalculate</li>
              <li>Batch operations for grouped updates</li>
            </ul>
          </div>

          <div>
            <h4 style={{ marginTop: 0, color: "#9C27B0" }}>🎯 Capabilities</h4>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              <li>Computed atoms</li>
              <li>Selective updates</li>
              <li>Batch operations</li>
              <li>State validation</li>
            </ul>
          </div>
        </div>

        <div
          style={{
            marginTop: "20px",
            paddingTop: "15px",
            borderTop: "1px solid #dee2e6",
            textAlign: "center",
            color: "#6c757d",
          }}
        >
          <strong>💡 Подсказка:</strong> Для лучшего понимания работы библиотеки
          изменяйте значения в форме и наблюдайте за обновлением только
          связанных компонентов в разделе "Счетчики ререндеров".
        </div>
      </div>
    </div>
  );
};
