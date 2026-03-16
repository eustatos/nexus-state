export { createForm } from './create-form';
export { zodValidator, yupValidator } from './schema-validation';
export type { InferSchema } from './schema-validation';
export { createFieldArray, getFieldArray } from './field-array';
export {
  createField,
  getFieldValue,
  setFieldValue,
  setFieldTouched,
  setFieldError,
  resetField,
  validateField,
} from './field';
export { AsyncValidationManager } from './async-validation';
export { ValidationTrigger } from './validation-trigger';
export {
  required,
  email,
  minLength,
  maxLength,
  minValue,
  maxValue,
  pattern,
  composeValidators,
  debounceAsyncValidator,
  createAsyncValidator,
  usernameAvailable,
  emailUnique,
  getFormValues,
  getFormErrors,
  areAllFieldsTouched,
  isAnyFieldDirty,
} from './utils';
export type {
  FormOptions,
  FormValues,
  Form,
  Field,
  FieldState,
  FormState,
  FormErrors,
  FieldValidator,
  AsyncFieldValidator,
  FormValidator,
  FieldOptions,
  FieldMeta,
  SchemaValidator,
  ZodSchema,
  YupSchema,
  FieldArray,
  FieldArrayOperations,
  FieldArrayMeta,
  AsyncValidator,
  AsyncValidatorOptions,
  AsyncValidatorWithConfig,
  ValidationMode,
  ReValidateMode,
  ValidationConfig,
} from './types';

// Modular exports
export { createFormCore, FormCore } from './core';
export {
  createValidation,
  ValidationAPI,
  ValidationOptions,
} from './validation';
export {
  createSubmission,
  SubmissionAPI,
  SubmissionOptions,
} from './submission';
