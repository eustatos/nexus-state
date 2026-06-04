# Task 01: Core Architecture

**Приоритет:** Critical  
**Оценка:** 1-2 недели  
**Статус:** Todo

---

## Цель

Создать core package (@nexus-state/form-builder) с базовой архитектурой.

---

## Scope

### 1. Package Structure

```
packages/form-builder/
├── src/
│   ├── schema/
│   │   ├── types.ts           # Schema types
│   │   ├── validator.ts       # Schema validation
│   │   └── index.ts
│   ├── registry/
│   │   ├── component-registry.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── state/
│   │   ├── builder-atom.ts    # Main state atom
│   │   ├── actions.ts         # State actions
│   │   └── index.ts
│   ├── export/
│   │   ├── code-generator.ts
│   │   ├── schema-generator.ts
│   │   └── index.ts
│   ├── index.ts
│   └── types.ts
├── package.json
├── tsconfig.json
└── README.md
```

### 2. Core Types

```typescript
// src/schema/types.ts
export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  fields: FieldSchema[];
  metadata?: Record<string, unknown>;
}

export interface FieldSchema {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: unknown;
  required?: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[];
  conditional?: ConditionalLogic;
  metadata?: Record<string, unknown>;
}

export type FieldType = 
  | 'text' 
  | 'email' 
  | 'number' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'textarea' 
  | 'date' 
  | 'file';

export interface ValidationRule {
  type: string;
  params?: Record<string, unknown>;
  message?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ConditionalLogic {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: unknown;
}
```

### 3. Component Registry

```typescript
// src/registry/types.ts
export interface ComponentDefinition {
  type: string;
  label: string;
  icon: string;
  category: ComponentCategory;
  defaultProps: Partial<FieldSchema>;
  configSchema: ConfigSchema;
  renderPreview: (props: FieldSchema) => React.ReactNode;
  renderField: (props: FieldSchema) => React.ReactNode;
}

export type ComponentCategory = 'input' | 'select' | 'layout' | 'advanced';

export interface ConfigSchema {
  [key: string]: ConfigField;
}

export interface ConfigField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'select';
  label: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: unknown;
}

// src/registry/component-registry.ts
export class ComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map();

  register(definition: ComponentDefinition): void {
    this.components.set(definition.type, definition);
  }

  get(type: string): ComponentDefinition | undefined {
    return this.components.get(type);
  }

  getAll(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  getByCategory(category: ComponentCategory): ComponentDefinition[] {
    return this.getAll().filter(c => c.category === category);
  }
}

export const defaultRegistry = new ComponentRegistry();
```

### 4. Builder State

```typescript
// src/state/builder-atom.ts
import { atom } from '@nexus-state/core';

export interface BuilderState {
  schema: FormSchema;
  selectedFieldId: string | null;
  history: FormSchema[];
  historyIndex: number;
  isDirty: boolean;
}

export const builderAtom = atom<BuilderState>({
  schema: {
    id: 'form-1',
    title: 'New Form',
    fields: [],
  },
  selectedFieldId: null,
  history: [],
  historyIndex: -1,
  isDirty: false,
});

// src/state/actions.ts
export const builderActions = {
  addField(field: FieldSchema) {
    builderAtom.update((state) => ({
      ...state,
      schema: {
        ...state.schema,
        fields: [...state.schema.fields, field],
      },
      isDirty: true,
    }));
  },

  removeField(fieldId: string) {
    builderAtom.update((state) => ({
      ...state,
      schema: {
        ...state.schema,
        fields: state.schema.fields.filter(f => f.id !== fieldId),
      },
      isDirty: true,
    }));
  },

  updateField(fieldId: string, updates: Partial<FieldSchema>) {
    builderAtom.update((state) => ({
      ...state,
      schema: {
        ...state.schema,
        fields: state.schema.fields.map(f =>
          f.id === fieldId ? { ...f, ...updates } : f
        ),
      },
      isDirty: true,
    }));
  },

  reorderFields(fromIndex: number, toIndex: number) {
    builderAtom.update((state) => {
      const fields = [...state.schema.fields];
      const [removed] = fields.splice(fromIndex, 1);
      fields.splice(toIndex, 0, removed);
      
      return {
        ...state,
        schema: { ...state.schema, fields },
        isDirty: true,
      };
    });
  },

  selectField(fieldId: string | null) {
    builderAtom.update((state) => ({
      ...state,
      selectedFieldId: fieldId,
    }));
  },

  setSchema(schema: FormSchema) {
    builderAtom.update((state) => ({
      ...state,
      schema,
      isDirty: false,
    }));
  },
};
```

---

## Implementation Plan

1. **Setup Package** (1 день)
   - Create package structure
   - Configure TypeScript
   - Setup build

2. **Core Types** (1 день)
   - Define schema types
   - Define component types
   - Define state types

3. **Component Registry** (2 дня)
   - Implement registry class
   - Built-in components definitions
   - Registration API

4. **Builder State** (2 дня)
   - Create builder atom
   - Implement actions
   - State management

5. **Tests** (2 дня)
   - Unit tests for registry
   - Unit tests for actions
   - Integration tests

6. **Documentation** (1 день)
   - API documentation
   - Architecture guide
   - Examples

---

## Acceptance Criteria

- [ ] Package structure создан
- [ ] Core types определены
- [ ] Component Registry реализован
- [ ] Builder State работает
- [ ] Actions покрывают все операции
- [ ] Tests 100% coverage
- [ ] Documentation complete

---

## Dependencies

- @nexus-state/core

---

## Notes

- Начать с минимального набора типов
- Registry должен быть расширяемым
- State должен поддерживать undo/redo (history)
