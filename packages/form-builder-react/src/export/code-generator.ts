/**
 * Code Generator for Form Builder
 *
 * Generates React/Vue/Svelte code from form schema.
 */

import type { FieldSchema, FormSchema } from '../schema/types';

/**
 * Code generator options
 */
export interface CodeGeneratorOptions {
  /** Target framework */
  framework: 'react' | 'vue' | 'svelte';
  /** Use TypeScript */
  typescript: boolean;
  /** Schema library */
  schemaLibrary: 'zod' | 'yup' | 'dsl' | 'none';
  /** Styling approach */
  styling: 'css' | 'tailwind' | 'styled-components';
}

/**
 * Generated file
 */
export interface GeneratedFile {
  /** File path */
  path: string;
  /** File content */
  content: string;
  /** File language */
  language: 'typescript' | 'javascript' | 'css' | 'scss';
}

/**
 * Generated code result
 */
export interface GeneratedCode {
  /** Generated files */
  files: GeneratedFile[];
  /** Form name */
  formName: string;
  /** Generation timestamp */
  timestamp: string;
}

/**
 * Convert string to PascalCase
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^./, chr => chr.toUpperCase());
}

/**
 * Convert string to kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Get Zod type for field
 */
function getZodType(field: FieldSchema): string {
  switch (field.type) {
    case 'number':
      return 'number()';
    case 'checkbox':
    case 'radio':
      return 'boolean()';
    case 'date':
    case 'datetime':
      return 'date()';
    default:
      return 'string()';
  }
}

/**
 * Generate Zod schema from field
 */
function generateZodField(field: FieldSchema): string {
  let validation = `z.${getZodType(field)}`;

  // Add validation rules
  if (field.validation) {
    for (const rule of field.validation) {
      switch (rule.type) {
        case 'required':
          // Required is default for Zod
          break;
        case 'minLength':
          validation += `.min(${rule.params?.length || 1})`;
          break;
        case 'maxLength':
          validation += `.max(${rule.params?.length || 100})`;
          break;
        case 'min':
          validation += `.min(${rule.params?.value || 0})`;
          break;
        case 'max':
          validation += `.max(${rule.params?.value || 100})`;
          break;
        case 'email':
          validation += `.email()`;
          break;
        case 'url':
          validation += `.url()`;
          break;
        case 'pattern':
          validation += `.regex(${rule.params?.pattern || '/.*/'})`;
          break;
      }
    }
  }

  if (!field.required) {
    validation += '.optional()';
  }

  return `  ${field.name}: ${validation}`;
}

/**
 * Generate Zod schema file
 */
function generateZodSchema(schema: FormSchema, typescript: boolean): GeneratedFile {
  const fields = schema.fields.map(field => generateZodField(field)).join(',\n');
  
  const content = `import { z } from 'zod';

export const ${toPascalCase(schema.title)}Schema = z.object({
${fields}
});
${typescript ? `\nexport type ${toPascalCase(schema.title)}FormData = z.infer<typeof ${toPascalCase(schema.title)}Schema>;` : ''}
`;

  return {
    path: `${toKebabCase(schema.title)}-schema.${typescript ? 'ts' : 'js'}`,
    content,
    language: typescript ? 'typescript' : 'javascript',
  };
}

/**
 * Generate field JSX
 */
function generateFieldJSX(field: FieldSchema): string {
   
  const _inputType = field.type === 'textarea' ? 'textarea' : 'input';
  
  if (field.type === 'textarea') {
    return `      <div className="form-field">
        <label htmlFor="${field.name}">
          ${field.label}${field.required ? ' <span className="required">*</span>' : ''}
        </label>
        <textarea
          id="${field.name}"
          name="${field.name}"
          placeholder="${field.placeholder || ''}"
          ${field.required ? 'required' : ''}
          {...register('${field.name}')}
        />
        {errors.${field.name} && <span className="error">{errors.${field.name}.message}</span>}
      </div>`;
  }

  if (field.type === 'select') {
    return `      <div className="form-field">
        <label htmlFor="${field.name}">
          ${field.label}${field.required ? ' <span className="required">*</span>' : ''}
        </label>
        <select
          id="${field.name}"
          name="${field.name}"
          ${field.required ? 'required' : ''}
          {...register('${field.name}')}
        >
          <option value="">Select...</option>
          ${field.options?.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('\n          ')}
        </select>
        {errors.${field.name} && <span className="error">{errors.${field.name}.message}</span>}
      </div>`;
  }

  if (field.type === 'checkbox') {
    return `      <div className="form-field">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="${field.name}"
            {...register('${field.name}')}
          />
          ${field.label}
        </label>
        {errors.${field.name} && <span className="error">{errors.${field.name}.message}</span>}
      </div>`;
  }

  return `      <div className="form-field">
        <label htmlFor="${field.name}">
          ${field.label}${field.required ? ' <span className="required">*</span>' : ''}
        </label>
        <input
          id="${field.name}"
          type="${field.type}"
          name="${field.name}"
          placeholder="${field.placeholder || ''}"
          ${field.required ? 'required' : ''}
          {...register('${field.name}')}
        />
        {errors.${field.name} && <span className="error">{errors.${field.name}.message}</span>}
      </div>`;
}

/**
 * Generate React component file
 */
function generateReactComponent(schema: FormSchema, options: CodeGeneratorOptions): GeneratedFile {
  const { typescript, schemaLibrary } = options;
  const ext = typescript ? 'tsx' : 'jsx';
  const componentName = toPascalCase(schema.title) + 'Form';

  const imports = [
    "import { useForm } from 'react-hook-form';",
    schemaLibrary === 'zod' ? "import { zodResolver } from '@hookform/resolvers/zod';" : '',
    schemaLibrary === 'yup' ? "import { yupResolver } from '@hookform/resolvers/yup';" : '',
    schemaLibrary !== 'none' ? `import { ${toKebabCase(schema.title)}Schema } from './${toKebabCase(schema.title)}-schema';` : '',
    typescript && schemaLibrary !== 'none' ? `import type { ${toPascalCase(schema.title)}FormData } from './${toKebabCase(schema.title)}-schema';` : '',
  ].filter(Boolean).join('\n');

  const fields = schema.fields.map(field => generateFieldJSX(field)).join('\n\n');

  const content = `${imports}

export function ${componentName}() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm${typescript && schemaLibrary !== 'none' ? `<${toPascalCase(schema.title)}FormData>` : ''}({
    ${schemaLibrary !== 'none' ? `resolver: ${schemaLibrary}Resolver(${toKebabCase(schema.title)}Schema),` : ''}
  });

  const onSubmit = (data${typescript && schemaLibrary !== 'none' ? `: ${toPascalCase(schema.title)}FormData` : ''}) => {
    console.log('Form submitted:', data);
    // TODO: Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="${toKebabCase(schema.title)}-form">
      <h2>${schema.title}</h2>
      ${schema.description ? `<p className="form-description">${schema.description}</p>` : ''}

${fields}

      <button type="submit">Submit</button>
    </form>
  );
}
`;

  return {
    path: `${componentName}.${ext}`,
    content,
    language: typescript ? 'typescript' : 'javascript',
  };
}

/**
 * Generate CSS file
 */
function generateCSS(schema: FormSchema): GeneratedFile {
  const content = `.${toKebabCase(schema.title)}-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 24px;
}

.${toKebabCase(schema.title)}-form h2 {
  margin-bottom: 16px;
}

.${toKebabCase(schema.title)}-form .form-description {
  color: #666;
  margin-bottom: 24px;
}

.${toKebabCase(schema.title)}-form .form-field {
  margin-bottom: 16px;
}

.${toKebabCase(schema.title)}-form label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.${toKebabCase(schema.title)}-form .required {
  color: red;
}

.${toKebabCase(schema.title)}-form input,
.${toKebabCase(schema.title)}-form select,
.${toKebabCase(schema.title)}-form textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.${toKebabCase(schema.title)}-form input:focus,
.${toKebabCase(schema.title)}-form select:focus,
.${toKebabCase(schema.title)}-form textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.${toKebabCase(schema.title)}-form .error {
  color: red;
  font-size: 12px;
  margin-top: 4px;
}

.${toKebabCase(schema.title)}-form button[type="submit"] {
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.${toKebabCase(schema.title)}-form button[type="submit"]:hover {
  background-color: #0056b3;
}

.${toKebabCase(schema.title)}-form button[type="submit"]:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.${toKebabCase(schema.title)}-form .checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.${toKebabCase(schema.title)}-form .checkbox-label input {
  width: auto;
}
`;

  return {
    path: `${toKebabCase(schema.title)}.css`,
    content,
    language: 'css',
  };
}

/**
 * Generate code from schema
 */
export function generateCode(schema: FormSchema, options: CodeGeneratorOptions): GeneratedCode {
  const files: GeneratedFile[] = [];

  // Generate schema file
  if (options.schemaLibrary !== 'none') {
    if (options.schemaLibrary === 'zod') {
      files.push(generateZodSchema(schema, options.typescript));
    }
    // Add yup and dsl generators as needed
  }

  // Generate component file
  if (options.framework === 'react') {
    files.push(generateReactComponent(schema, options));
  }
  // Add vue and svelte generators as needed

  // Generate CSS file
  if (options.styling === 'css') {
    files.push(generateCSS(schema));
  }

  return {
    files,
    formName: toPascalCase(schema.title) + 'Form',
    timestamp: new Date().toISOString(),
  };
}
