import { SimpleTimeTravel } from '@nexus-state/core'
import { editorStore } from './store'

/**
 * Time-travel конфигурация для редактора
 *
 * Обеспечивает возможность отката изменений и навигации по истории состояний.
 */
export const editorTimeTravel = new SimpleTimeTravel(editorStore, {
  // Максимальное количество снимков в истории
  maxHistory: 100,

  // Отключаем авто-снимки — используем debounce-хук
  autoCapture: false,

  // Delta-сжатие для экономии памяти
  deltaSnapshots: {
    enabled: true,
    fullSnapshotInterval: 10,        // Полный снимок каждые 10 изменений
    maxDeltaChainLength: 20,         // Максимальная длина цепочки дельт
    changeDetection: 'deep'          // Глубокое сравнение изменений
  },

  // TTL для атомов (очистка старых данных)
  atomTTL: 300000, // 5 минут

  // Настройки отслеживания
  trackingConfig: {
    autoTrack: true,                 // Автоматически отслеживать новые атомы
    trackComputed: true,             // Отслеживать вычисляемые атомы
    trackWritable: true,             // Отслеживать записываемые атомы
    trackPrimitive: true             // Отслеживать примитивные значения
  },

  // Стратегия очистки
  cleanupStrategy: 'lru',            // Least Recently Used
  gcInterval: 60000                  // Сборка мусора каждую минуту
})
