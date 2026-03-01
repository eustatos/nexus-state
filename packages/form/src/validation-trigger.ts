import type { ValidationMode, ReValidateMode, FieldState } from './types';

export interface ValidationTriggerOptions {
  mode: ValidationMode;
  reValidateMode: ReValidateMode;
  showErrorsOnTouched: boolean;
}

/**
 * Manages validation trigger logic for a field.
 * Controls when validation should run based on configured modes.
 */
export class ValidationTrigger {
  private hasError = false;

  constructor(private readonly options: ValidationTriggerOptions) {}

  /**
   * Should validate on value change
   */
  public shouldValidateOnChange(state: { validated: boolean; touched: boolean }): boolean {
    const { mode, reValidateMode } = this.options;

    // First validation
    if (!state.validated) {
      return mode === 'onChange';
    }

    // Revalidation (after error shown)
    if (this.hasError) {
      return reValidateMode === 'onChange';
    }

    // Continue validating if already validating on change
    return mode === 'onChange';
  }

  /**
   * Should validate on blur
   */
  public shouldValidateOnBlur(state: { validated: boolean; touched: boolean }): boolean {
    const { mode, reValidateMode } = this.options;

    // First validation
    if (!state.validated) {
      return mode === 'onBlur';
    }

    // Revalidation
    if (this.hasError) {
      return reValidateMode === 'onBlur';
    }

    return mode === 'onBlur';
  }

  /**
   * Should validate on submit
   */
  public shouldValidateOnSubmit(): boolean {
    // Always validate on submit regardless of mode
    return true;
  }

  /**
   * Should show error message
   */
  public shouldShowError(state: { touched: boolean; error: string | null }): boolean {
    if (!state.error) {
      return false;
    }

    if (this.options.showErrorsOnTouched) {
      return state.touched;
    }

    return true;
  }

  /**
   * Update internal error state
   */
  public setHasError(hasError: boolean): void {
    this.hasError = hasError;
  }

  /**
   * Reset trigger state
   */
  public reset(): void {
    this.hasError = false;
  }
}
