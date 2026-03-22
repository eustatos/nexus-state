import { FormCore } from './core';
import { ValidationAPI } from './validation';

export interface SubmissionOptions<TValues extends FormValues> {
  /** Submit handler */
  onSubmit?: (values: TValues) => void | Promise<void>;
  /** Whether to validate before submit (default: true) */
  validateBeforeSubmit?: boolean;
  /** Whether to mark fields as touched on submit (default: true) */
  markTouchedOnSubmit?: boolean;
}

export interface SubmissionAPI<TValues extends FormValues> {
  /** Submit the form */
  submit(): Promise<void>;
  /** Reset submission state */
  resetSubmission(): void;
  /** Get submission state */
  isSubmitting: boolean;
  submitCount: number;
  // Internal type marker
  __type?: TValues;
}

/**
 * Create submission module for a form.
 */
export function createSubmission<TValues extends FormValues>(
  core: FormCore<TValues>,
  validation: ValidationAPI<TValues>,
  options: SubmissionOptions<TValues> = {}
): SubmissionAPI<TValues> {
  const { store, state } = core;
  const {
    onSubmit,
    validateBeforeSubmit = true,
    markTouchedOnSubmit = true,
  } = options;

  const submit = async (): Promise<void> => {
    // Mark all fields as touched
    if (markTouchedOnSubmit) {
      for (const [key] of core.fields.entries()) {
        core.setFieldTouched(key, true);
      }
    }

    // Validate if needed
    if (validateBeforeSubmit) {
      const result = await validation.validateAll();
      if (!result.valid) {
        return;
      }
    }

    // Set submitting state
    const currentState = store.get(state);
    store.set(state, {
      ...currentState,
      isSubmitting: true,
    });

    try {
      const values = core.getValues();
      if (onSubmit) {
        await onSubmit(values);
      }

      // Update submit count
      store.set(state, {
        ...currentState,
        isSubmitting: false,
        submitCount: currentState.submitCount + 1,
      });
    } catch (error) {
      store.set(state, {
        ...currentState,
        isSubmitting: false,
      });
      throw error;
    }
  };

  const resetSubmission = (): void => {
    const currentState = store.get(state);
    store.set(state, {
      ...currentState,
      isSubmitting: false,
      submitCount: 0,
    });
  };

  return {
    submit,
    resetSubmission,
    get isSubmitting() {
      return store.get(state).isSubmitting;
    },
    get submitCount() {
      return store.get(state).submitCount;
    },
  };
}

// Re-export FormValues from types for convenience
import { FormValues } from './types';
export type { FormValues };
