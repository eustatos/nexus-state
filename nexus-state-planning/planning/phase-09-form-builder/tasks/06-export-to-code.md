# Task 06: Export to Code

**Приоритет:** High  
**Оценка:** 1 неделя  
**Статус:** Todo

---

## Цель

Реализовать генерацию production-ready React кода из schema.

---

## Scope

### 1. Code Generator

```typescript
// packages/form-builder/src/export/code-generator.ts
import { FormSchema } from '../schema/types';

export interface CodeGeneratorOptions {
  framework: 'react' | 'vue' | 'svelte';
  typescript: boolean;
  schemaLibrary: 'zod' | 'yup' | 'none';
  styling: 'css' | 'tailwind' | 'styled-components';
}

export function generateCode(
  schema: FormSchema,
  options: CodeGeneratorOptions
): GeneratedCode {
  switch (options.framework) {
    case 'react':
      return generateReactCode(schema, options);
    case 'vue':
      return generateVueCode(schema, options);
    case 'svelte':
      return generateSvelteCode(schema, options);
  }
}

export interface GeneratedCode {
  files: GeneratedFile[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: 'typescript' | 'javascript' | 'css';
}
```

### 2. React Code Generator

```typescript
// packages/form-builder/src/export/react-generator.ts
function generateReactCode(
  schema: FormSchema,
  options: CodeGeneratorOptions
): GeneratedCode {
  const files: GeneratedFile[] = [];

  // Generate schema file
  if (options.schemaLibrary !== 'none') {
    files.push(generateSchemaFile(schema, options));
  }

  // Generate component file
  files.push(generateComponentFile(schema, options));

  // Generate styles file
  if (options.styling === 'css') {
    files.push(generateStylesFile(schema, options));
  }

  // Generate types file (if TypeScript)
  if (options.typescript) {
    files.push(generateTypesFile(schema, options));
  }

  return { files };
}

function generateSchemaFile(
  schema: FormSchema,
  options: CodeGeneratorOptions
): GeneratedFile {
  const { schemaLibrary, typescript } = options;
  const ext = typescript ? 'ts' : 'js';

  if (schemaLibrary === 'zod') {
    const content = `
import { z } from 'zod';

export const ${toCamelCase(schema.title)}Schema = z.object({
${schema.fields.map(field => generateZodField(field)).join(',\n')}
});

${typescript ? `export type ${toPascalCase(schema.title)}FormData = z.infer<typeof ${toCamelCase(schema.title)}Schema>;` : ''}
`.trim();

    return {
      path: `${toKebabCase(schema.title)}-schema.${ext}`,
      content,
      language: typescript ? 'typescript' : 'javascript',
    };
  }

  // Similar for Yup...
  return { path: '', content: '', language: 'typescript' };
}

function generateZodField(field: FieldSchema): string {
  let validation = `z.${getZodType(field.type)}()`;

  if (field.validation) {
    for (const rule of field.validation) {
      switch (rule.type) {
        case 'required':
          // Zod fields are required by default
          break;
        case 'minLength':
          validation += `.min(${rule.params?.length})`;
          break;
        case 'maxLength':
          validation += `.max(${rule.params?.length})`;
          break;
        case 'email':
          validation += `.email()`;
          break;
        case 'url':
          validation += `.url()`;
          break;
        case 'pattern':
          validation += `.regex(/${rule.params?.pattern}/)`;
          break;
      }
    }
  }

  if (!field.required) {
    validation += `.optional()`;
  }

  return `  ${field.name}: ${validation}`;
}

function generateComponentFile(
  schema: FormSchema,
  options: CodeGeneratorOptions
): GeneratedFile {
  const { typescript, schemaLibrary } = options;
  const ext = typescript ? 'tsx' : 'jsx';
  const componentName = toPascalCase(schema.title) + 'Form';

  const imports = `
import { useForm } from 'react-hook-form';
${schemaLibrary === 'zod' ? `import { zodResolver } from '@hookform/resolvers/zod';` : ''}
${schemaLibrary === 'yup' ? `import { yupResolver } from '@hookform/resolvers/yup';` : ''}
${schemaLibrary !== 'none' ? `import { ${toCamelCase(schema.title)}Schema } from './${toKebabCase(schema.title)}-schema';` : ''}
${typescript && schemaLibrary !== 'none' ? `import type { ${toPascalCase(schema.title)}FormData } from './${toKebabCase(schema.title)}-schema';` : ''}
`.trim();

  const component = `
export function ${componentName}() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm${typescript && schemaLibrary !== 'none' ? `<${toPascalCase(schema.title)}FormData>` : ''}({
    ${schemaLibrary !== 'none' ? `resolver: ${schemaLibrary}Resolver(${toCamelCase(schema.title)}Schema),` : ''}
  });

  const onSubmit = (data${typescript && schemaLibrary !== 'none' ? `: ${toPascalCase(schema.title)}FormData` : ''}) => {
    console.log(data);
    // TODO: Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="${toKebabCase(schema.title)}-form">
      <h2>${schema.title}</h2>
      ${schema.description ? `<p className="form-description">${schema.description}</p>` : ''}

${schema.fields.map(field => generateFieldJSX(field)).join('\n\n')}

      <button type="submit">Submit</button>
    </form>
  );
}
`.trim();

  return {
    path: `${componentName}.${ext}`,
    content: `${imports}\n\n${component}`,
    language: typescript ? 'typescript' : 'javascript',
  };
}

function generateFieldJSX(field: FieldSchema): string {
  return `
      <div className="form-field">
        <label htmlFor="${field.name}">
          ${field.label}
          ${field.required ? '<span className="required">*</span>' : ''}
        </label>
        ${generateInputJSX(field)}
        {errors.${field.name} && (
          <span className="error">{errors.${field.name}.message}</span>
        )}
      </div>
`.trim();
}

function generateInputJSX(field: FieldSchema): string {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'number':
      return `
        <input
          id="${field.name}"
          type="${field.type}"
          ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
          {...register('${field.name}')}
        />
      `.trim();

    case 'textarea':
      return `
        <textarea
          id="${field.name}"
          ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
          {...register('${field.name}')}
        />
      `.trim();

    case 'select':
      return `
        <select id="${field.name}" {...register('${field.name}')}>
          <option value="">Select...</option>
          ${field.options?.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('\n          ')}
        </select>
      `.trim();

    case 'checkbox':
      return `
        <input
          id="${field.name}"
          type="checkbox"
          {...register('${field.name}')}
        />
      `.trim();

    default:
      return `<input id="${field.name}" {...register('${field.name}')} />`;
  }
}
```

### 3. Export UI

```typescript
// packages/form-builder-ui/src/components/ExportDialog.tsx
export function ExportDialog() {
  const [state] = useAtom(builderAtom);
  const [options, setOptions] = useState<CodeGeneratorOptions>({
    framework: 'react',
    typescript: true,
    schemaLibrary: 'zod',
    styling: 'css',
  });

  const handleExport = () => {
    const code = generateCode(state.schema, options);
    downloadCode(code);
  };

  return (
    <dialog className="export-dialog">
      <h2>Export Form</h2>

      <div className="export-options">
        <label>
          Framework
          <select
            value={options.framework}
            onChange={(e) => setOptions({ ...options, framework: e.target.value as any })}
          >
            <option value="react">React</option>
            <option value="vue">Vue</option>
            <option value="svelte">Svelte</option>
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={options.typescript}
            onChange={(e) => setOptions({ ...options, typescript: e.target.checked })}
          />
          TypeScript
        </label>

        <label>
          Schema Library
          <select
            value={options.schemaLibrary}
            onChange={(e) => setOptions({ ...options, schemaLibrary: e.target.value as any })}
          >
            <option value="zod">Zod</option>
            <option value="yup">Yup</option>
            <option value="none">None</option>
          </select>
        </label>

        <label>
          Styling
          <select
            value={options.styling}
            onChange={(e) => setOptions({ ...options, styling: e.target.value as any })}
          >
            <option value="css">CSS</option>
            <option value="tailwind">Tailwind</option>
            <option value="styled-components">Styled Components</option>
          </select>
        </label>
      </div>

      <div className="export-actions">
        <button onClick={handleExport}>Download Code</button>
        <button onClick={() => copyToClipboard(generateCode(state.schema, options))}>
          Copy to Clipboard
        </button>
      </div>
    </dialog>
  );
}
```

---

## Implementation Plan

1. **Code Generator Core** (2 дня)
   - Generator interface
   - React generator
   - Schema generation (Zod/Yup)

2. **Component Generation** (2 дня)
   - JSX generation
   - Field rendering
   - Validation integration

3. **Export UI** (1 день)
   - Export dialog
   - Options configuration
   - Download/copy functionality

4. **Additional Frameworks** (1 день)
   - Vue generator
   - Svelte generator

5. **Polish** (1 день)
   - Code formatting
   - Comments generation
   - README generation

---

## Acceptance Criteria

- [ ] Генерирует валидный React код
- [ ] Zod/Yup schemas корректны
- [ ] TypeScript types правильные
- [ ] Код можно скопировать/скачать
- [ ] Поддержка Vue/Svelte (базовая)

---

## Dependencies

- Task 01 (Core Architecture)

---

## Notes

- Использовать prettier для форматирования
- Генерировать комментарии для сложной логики
- Добавить README с инструкциями
