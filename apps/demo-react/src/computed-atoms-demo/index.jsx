import React, { useState, useCallback, memo } from 'react';
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/react';
// Temporarily disabled DevTools import for debugging
// import { devTools } from '@nexus-state/devtools';

// --- 1. Основные атомы (state atoms) ---
const firstNameAtom = atom('John', 'firstName');
const lastNameAtom = atom('Doe', 'lastName');
const ageAtom = atom(30, 'age');
const isActiveAtom = atom(true, 'isActive');

// --- 2. Вычисляемые атомы (computed atoms) ---
const fullNameAtom = atom(
  (get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`,
  'fullName'
);

const isAdultAtom = atom(
  (get) => get(ageAtom) >= 18,
  'isAdult'
);

const profileSummaryAtom = atom(
  (get) => {
    const name = get(fullNameAtom);
    const age = get(ageAtom);
    const active = get(isActiveAtom);
    return `${name}, ${age} years old, ${active ? 'Active' : 'Inactive'}`;
  },
  'profileSummary'
);

// --- 3. Атомы для демонстрации селективного обновления ---
const needsUpdateAtom = atom(
  (get) => {
    const firstName = get(firstNameAtom);
    const lastName = get(lastNameAtom);
    const age = get(ageAtom);
    const isActive = get(isActiveAtom);
    
    // Проверяем, отличается ли текущее состояние от начального
    return firstName !== 'John' || 
           lastName !== 'Doe' || 
           age !== 30 || 
           isActive !== true;
  },
  'needsUpdate'
);

const isValidAtom = atom(
  (get) => {
    const age = get(ageAtom);
    const firstName = get(firstNameAtom);
    const lastName = get(lastNameAtom);
    
    const isAgeValid = age >= 0 && age <= 150;
    const isFirstNameValid = firstName.trim().length > 0;
    const isLastNameValid = lastName.trim().length > 0;
    
    return isAgeValid && isFirstNameValid && isLastNameValid;
  },
  'isValid'
);

// --- 4. Создание store без DevTools ---
// const store = createStore([
//   devTools({
//     name: 'Computed Atoms Demo',
//     trace: true,
//     traceLimit: 5,
//     maxAge: 100,
//     showAtomNames: true,
//     latency: 50,
//     actionNamingStrategy: 'auto',
//     stateSanitizer: (state) => state, // Можно добавить кастомную санитизацию
//   })
// ]);
const store = createStore();

// --- 5. Компонент с счетчиком ререндеров ---
const RenderCounter = memo(({ atom, label }) => {
  const [renderCount, setRenderCount] = useState(0);
  const [value, setValue] = useAtom(atom, store);
  
  // Log when component renders
  React.useEffect(() => {
    console.log(`RenderCounter ${label} re-render, value:`, value);
  }, [label, value]);
  
  // Increase render count only when atom value changes
  React.useEffect(() => {
    console.log(`RenderCounter ${label} value changed, incrementing count`);
    setRenderCount(c => c + 1);
  }, [value]); // Depend on value, not on every render

  return (
    <div style={{ 
      padding: '8px', 
      margin: '4px 0',
      backgroundColor: '#f5f5f5',
      borderRadius: '4px',
      border: '1px solid #ddd'
    }}>
      <strong>{label}:</strong> {JSON.stringify(value)} 
      <span style={{ 
        marginLeft: '10px', 
        fontSize: '0.85em',
        color: '#666',
        backgroundColor: '#e0e0e0',
        padding: '2px 6px',
        borderRadius: '3px'
      }}>
        renders: {renderCount}
      </span>
    </div>
  );
});

// --- 6. Компонент поля ввода с селективным обновлением ---
const InputField = memo(({ atom, label, type = 'text' }) => {
  const [value, setValue] = useAtom(atom, store);
  
  const handleChange = useCallback((e) => {
    const newValue = type === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
    setValue(newValue);
  }, [setValue, type]);

  return (
    <div style={{ marginBottom: '15px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
        {label}:
      </label>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        style={{
          width: '100%',
          padding: '8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      />
    </div>
  );
});

// --- 7. Компонент переключателя ---
const ToggleField = memo(({ atom, label }) => {
  const [value, setValue] = useAtom(atom, store);
  
  return (
    <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
      <label style={{ marginRight: '10px', fontWeight: '500' }}>
        {label}:
      </label>
      <button
        onClick={() => setValue(!value)}
        style={{
          padding: '6px 12px',
          backgroundColor: value ? '#4CAF50' : '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        {value ? 'Active' : 'Inactive'}
      </button>
    </div>
  );
});

// --- 8. Главный компонент демонстрации ---
const ComputedAtomsDemo = () => {
  const [batchId, setBatchId] = useState(null);
  
  const handleReset = useCallback(() => {
    store.set(firstNameAtom, 'John');
    store.set(lastNameAtom, 'Doe');
    store.set(ageAtom, 30);
    store.set(isActiveAtom, true);
  }, []);

  const handleUpdateAll = useCallback(() => {
    // Демонстрация batch-обновлений
    const batchId = `batch-${Date.now()}`;
    
    // Если store поддерживает startBatch/endBatch
    if (store.startBatch && store.endBatch) {
      store.startBatch(batchId);
    }
    
    store.set(firstNameAtom, 'Jane');
    store.set(lastNameAtom, 'Smith');
    store.set(ageAtom, 25);
    store.set(isActiveAtom, false);
    
    if (store.startBatch && store.endBatch) {
      store.endBatch(batchId);
    }
  }, []);

  const handleIncrementAge = useCallback(() => {
    store.set(ageAtom, (prev) => prev + 1);
  }, []);

  const handleDecrementAge = useCallback(() => {
    store.set(ageAtom, (prev) => prev - 1);
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#333', borderBottom: '2px solid #4CAF50', paddingBottom: '10px' }}>
        🎯 Nexus State: Computed Atoms Demo
      </h1>
      
      <div style={{ 
        backgroundColor: '#e8f5e9', 
        padding: '15px', 
        borderRadius: '5px',
        marginBottom: '20px',
        border: '1px solid #c8e6c9'
      }}>
        <h3 style={{ marginTop: 0, color: '#2e7d32' }}>💡 Что демонстрируется:</h3>
        <ul style={{ marginBottom: 0 }}>
          <li><strong>Вычисляемые атомы</strong> — автоматически пересчитываются при изменении зависимостей</li>
          <li><strong>Селективное обновление</strong> — React компоненты обновляются только при изменении их атомов</li>
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Левая колонка: Форма */}
        <div>
          <h2 style={{ color: '#2196F3' }}>📝 Форма</h2>
          
          <InputField atom={firstNameAtom} label="First Name" />
          <InputField atom={lastNameAtom} label="Last Name" />
          <InputField atom={ageAtom} label="Age" type="number" />
          <ToggleField atom={isActiveAtom} label="Status" />
          
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleReset}
              style={{
                padding: '10px 15px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔄 Reset All
            </button>
            
            <button
              onClick={handleUpdateAll}
              style={{
                padding: '10px 15px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📦 Update All (Batch)
            </button>
            
            <button
              onClick={handleIncrementAge}
              style={{
                padding: '10px 15px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ➕ Age +1
            </button>
            
            <button
              onClick={handleDecrementAge}
              style={{
                padding: '10px 15px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ➖ Age -1
            </button>
          </div>
        </div>

        {/* Правая колонка: Вычисляемые значения */}
        <div>
          <h2 style={{ color: '#9C27B0' }}>🧮 Вычисляемые атомы</h2>
          
          <RenderCounter atom={fullNameAtom} label="Full Name" />
          <RenderCounter atom={isAdultAtom} label="Is Adult" />
          <RenderCounter atom={profileSummaryAtom} label="Profile Summary" />
          
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ color: '#FF5722' }}>🔍 Состояние формы</h3>
            <RenderCounter atom={needsUpdateAtom} label="Form has changes" />
            <RenderCounter atom={isValidAtom} label="Form is valid" />
          </div>
        </div>
      </div>

      {/* Информационная панель */}
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f3e5f5',
        borderRadius: '5px',
        border: '1px solid #e1bee7'
      }}>
        <h3 style={{ marginTop: 0, color: '#7B1FA2' }}>🎬 Примеры для проверки:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <h4 style={{ color: '#7B1FA2', fontSize: '14px' }}>Селективное обновление:</h4>
            <ul style={{ fontSize: '14px', margin: 0 }}>
              <li>Измените <strong>First Name</strong> → обновятся только <code>fullName</code> и <code>profileSummary</code></li>
              <li>Измените <strong>Age</strong> → обновятся <code>isAdult</code> и <code>profileSummary</code></li>
              <li>Переключите <strong>Status</strong> → обновится только <code>profileSummary</code></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#7B1FA2', fontSize: '14px' }}>Атомарное обновление:</h4>
            <ul style={{ fontSize: '14px', margin: 0 }}>
              <li>React компоненты обновляются только при изменении их атомов</li>
              <li>Вычисляемые атомы автоматически пересчитываются</li>
              <li>Изменения отслеживаются через консоль</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Счетчики ререндеров для всех атомов */}
      <div style={{ 
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#fff3e0',
        borderRadius: '5px',
        border: '1px solid #ffcc80'
      }}>
        <h3 style={{ marginTop: 0, color: '#EF6C00' }}>📊 Счетчики ререндеров всех атомов:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <RenderCounter atom={firstNameAtom} label="firstName" />
          <RenderCounter atom={lastNameAtom} label="lastName" />
          <RenderCounter atom={ageAtom} label="age" />
          <RenderCounter atom={isActiveAtom} label="isActive" />
          <RenderCounter atom={fullNameAtom} label="fullName" />
          <RenderCounter atom={isAdultAtom} label="isAdult" />
          <RenderCounter atom={profileSummaryAtom} label="profileSummary" />
          <RenderCounter atom={needsUpdateAtom} label="needsUpdate" />
          <RenderCounter atom={isValidAtom} label="isValid" />
        </div>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px',
        backgroundColor: '#e3f2fd',
        borderRadius: '5px',
        border: '1px solid #bbdefb',
        fontSize: '14px',
        color: '#1565c0'
      }}>
        <strong>💡 Подсказка:</strong> Откройте консоль разработчика для наблюдения за обновлениями атомов.
        Обратите внимание, как изменяются только те компоненты, чьи атомы действительно изменились.
      </div>
    </div>
  );
};

export default ComputedAtomsDemo;