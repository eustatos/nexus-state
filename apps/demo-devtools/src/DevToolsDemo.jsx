import React from 'react'
import { useAtom } from '@nexus-state/react'
import { atom, createStore, SimpleTimeTravel } from '@nexus-state/core'
import { devTools } from '@nexus-state/devtools'

// Простой пример счетчика
const countAtom = atom(0, 'counter')
const doubleCountAtom = atom((get) => get(countAtom) * 2, 'doubleCount')
const isEvenAtom = atom((get) => get(countAtom) % 2 === 0, 'isEven')

// Создаем store
const store = createStore()

// Создаем экземпляр SimpleTimeTravel
const timeTravel = new SimpleTimeTravel(store, {
  maxHistory: 50,
  autoCapture: true,
})

// Создаем и настраиваем DevTools plugin
const devtoolsPlugin = devTools()

// Применяем DevTools plugin - timeTravel будет автоматически обнаружен
devtoolsPlugin.apply(store)

const CounterDemo = () => {
  const [count, setCount] = useAtom(countAtom, store)
  const [doubleCount] = useAtom(doubleCountAtom, store)
  const [isEven] = useAtom(isEvenAtom, store)
  
  // Get time travel info
  const historyLength = timeTravel.getHistory().length
  const canUndo = timeTravel.canUndo()
  const canRedo = timeTravel.canRedo()

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
        <strong>ℹ️ Time Travel Info:</strong>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>History entries: {historyLength}</li>
          <li>Can Undo: {canUndo ? '✅ Yes' : '❌ No'}</li>
          <li>Can Redo: {canRedo ? '✅ Yes' : '❌ No'}</li>
        </ul>
        <p><strong>💡 Instructions:</strong> Use Redux DevTools extension to navigate through history. Click on any state in the DevTools timeline to jump to it.</p>
      </div>
    </div>
  )
}

export default CounterDemo
