import React from 'react'
import { useAtom } from '@nexus-state/react'
import { atom, createStore } from '@nexus-state/core'
import { devTools } from '@nexus-state/devtools'

// Простой пример счетчика
const countAtom = atom(0, 'counter')
const doubleCountAtom = atom((get) => get(countAtom) * 2, 'doubleCount')
const isEvenAtom = atom((get) => get(countAtom) % 2 === 0, 'isEven')

// Создаем store с devtools
const store = createStore()
const devtoolsPlugin = devTools()
devtoolsPlugin.apply(store)

const CounterDemo = () => {
  const [count, setCount] = useAtom(countAtom, store)
  const [doubleCount] = useAtom(doubleCountAtom, store)
  const [isEven] = useAtom(isEvenAtom, store)

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#333', borderBottom: '2px solid #2196F3', paddingBottom: '10px' }}>
        ⚡ Nexus State DevTools Demo
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        <div>
          <h2 style={{ color: '#2196F3' }}>Counter</h2>
          <div style={{ fontSize: '48px', fontWeight: 'bold', textAlign: 'center', color: '#2196F3', margin: '20px 0' }}>
            {count}
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCount((prev) => prev + 1)}
              style={{ padding: '12px 24px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
            >
              ➕ Increment
            </button>
            <button
              onClick={() => setCount((prev) => prev - 1)}
              style={{ padding: '12px 24px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
            >
              ➖ Decrement
            </button>
            <button
              onClick={() => setCount(0)}
              style={{ padding: '12px 24px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
            >
              🔄 Reset
            </button>
          </div>
        </div>

        <div>
          <h2 style={{ color: '#9C27B0' }}>Computed Values</h2>
          <div style={{ backgroundColor: '#f3e5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '14px', color: '#7B1FA2', marginBottom: '5px' }}>Double Count:</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>{doubleCount}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#7B1FA2', marginBottom: '5px' }}>Is Even:</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: isEven ? '#4CAF50' : '#FF5722' }}>
                {isEven ? '✅ Yes' : '❌ No'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#E8F5E9', borderRadius: '5px', border: '1px solid #C8E6C9', fontSize: '14px', color: '#2E7D32' }}>
        <strong>ℹ️ Information:</strong> This is a demonstration of DevTools integration. Use Nexus State DevTools to inspect atoms and their states.
      </div>
    </div>
  )
}

export default CounterDemo
