# Task 08: UI Polish

**Приоритет:** Medium  
**Оценка:** 1 неделя  
**Статус:** Todo

---

## Цель

Отполировать UI для профессионального внешнего вида и отличного UX.

---

## Scope

### 1. Design System

```typescript
// packages/form-builder-ui/src/styles/design-tokens.css
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-danger: #ef4444;
  --color-warning: #f59e0b;

  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --bg-hover: #e2e8f0;

  /* Borders */
  --border-color: #e2e8f0;
  --border-radius: 8px;
  --border-radius-sm: 4px;
  --border-radius-lg: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 20px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}
```

### 2. Component Styling

```css
/* packages/form-builder-ui/src/components/FormBuilder.css */
.form-builder {
  display: grid;
  grid-template-columns: 250px 1fr 300px;
  gap: var(--spacing-md);
  height: 100vh;
  background: var(--bg-secondary);
  font-family: var(--font-family);
}

.palette {
  background: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  padding: var(--spacing-md);
  overflow-y: auto;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  cursor: grab;
  transition: background var(--transition-fast);
}

.palette-item:hover {
  background: var(--bg-hover);
}

.palette-item:active {
  cursor: grabbing;
}

.canvas {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  margin: var(--spacing-md);
  box-shadow: var(--shadow-md);
  overflow-y: auto;
}

.field-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-sm);
  transition: all var(--transition-base);
}

.field-item:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.field-item.selected {
  border-color: var(--color-primary);
  background: var(--bg-primary);
  box-shadow: var(--shadow-md);
}

.drag-handle {
  cursor: grab;
  color: var(--color-secondary);
  font-size: var(--font-size-lg);
}

.drag-handle:active {
  cursor: grabbing;
}

.properties-panel {
  background: var(--bg-primary);
  border-left: 1px solid var(--border-color);
  padding: var(--spacing-md);
  overflow-y: auto;
}

.property-field {
  margin-bottom: var(--spacing-md);
}

.property-field label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-secondary);
  margin-bottom: var(--spacing-xs);
}

.property-field input,
.property-field select,
.property-field textarea {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-fast);
}

.property-field input:focus,
.property-field select:focus,
.property-field textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

### 3. Animations

```css
/* packages/form-builder-ui/src/styles/animations.css */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.fade-in {
  animation: fadeIn var(--transition-base);
}

.slide-in {
  animation: slideIn var(--transition-base);
}

.pulse {
  animation: pulse 2s infinite;
}

/* Drag and drop animations */
.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.drop-target {
  border: 2px dashed var(--color-primary);
  background: rgba(59, 130, 246, 0.05);
}
```

### 4. Responsive Design

```css
/* packages/form-builder-ui/src/styles/responsive.css */
@media (max-width: 1024px) {
  .form-builder {
    grid-template-columns: 200px 1fr 250px;
  }
}

@media (max-width: 768px) {
  .form-builder {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }

  .palette,
  .properties-panel {
    border: none;
    border-bottom: 1px solid var(--border-color);
  }
}
```

### 5. Dark Mode

```css
/* packages/form-builder-ui/src/styles/dark-mode.css */
[data-theme="dark"] {
  --color-primary: #60a5fa;
  --color-primary-hover: #3b82f6;
  --color-secondary: #94a3b8;

  --bg-primary: #1e293b;
  --bg-secondary: #0f172a;
  --bg-tertiary: #020617;
  --bg-hover: #334155;

  --border-color: #334155;
}
```

---

## Implementation Plan

1. **Design System** (1 день)
   - Design tokens
   - Color palette
   - Typography scale
   - Spacing system

2. **Component Styling** (2 дня)
   - Palette styling
   - Canvas styling
   - Properties panel styling
   - Field items styling

3. **Animations** (1 день)
   - Fade in/out
   - Slide animations
   - Drag and drop feedback
   - Loading states

4. **Responsive Design** (1 день)
   - Mobile layout
   - Tablet layout
   - Desktop layout

5. **Dark Mode** (1 день)
   - Dark theme colors
   - Theme toggle
   - Persistence

6. **Polish** (1 день)
   - Micro-interactions
   - Loading states
   - Empty states
   - Error states

---

## Acceptance Criteria

- [ ] UI выглядит профессионально
- [ ] Animations плавные и не отвлекают
- [ ] Responsive design работает на всех размерах
- [ ] Dark mode полностью функционален
- [ ] Accessibility соблюдена

---

## Dependencies

- All previous tasks

---

## Notes

- Использовать CSS variables для theming
- Следовать Material Design principles
- Тестировать на разных браузерах
- Обеспечить accessibility (WCAG 2.1 AA)
