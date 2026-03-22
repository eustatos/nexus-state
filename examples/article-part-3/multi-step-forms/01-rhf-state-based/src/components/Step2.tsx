import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { Step2FormData } from '../schemas';

interface Step2Props {
  register: UseFormRegister<Step2FormData>;
  errors: FieldErrors<Step2FormData>;
}

export function Step2({ register, errors }: Step2Props) {
  return (
    <div style={styles.step}>
      <h2 style={styles.title}>Step 2: Address Information</h2>
      <p style={styles.description}>
        Where should we ship your order?
      </p>

      <div style={styles.field}>
        <label htmlFor="street" style={styles.label}>
          Street Address <span aria-hidden="true">*</span>
        </label>
        <input
          id="street"
          {...register('street', { required: 'Street address is required' })}
          style={{
            ...styles.input,
            ...(errors.street ? styles.inputError : {}),
          }}
          placeholder="123 Main Street, Apt 4B"
          aria-invalid={!!errors.street}
          aria-describedby={errors.street ? 'street-error' : undefined}
        />
        {errors.street && (
          <span id="street-error" style={styles.error} role="alert">
            {errors.street.message}
          </span>
        )}
      </div>

      <div style={styles.row}>
        <div style={styles.field}>
          <label htmlFor="city" style={styles.label}>
            City <span aria-hidden="true">*</span>
          </label>
          <input
            id="city"
            {...register('city', { required: 'City is required' })}
            style={{
              ...styles.input,
              ...(errors.city ? styles.inputError : {}),
            }}
            placeholder="New York"
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? 'city-error' : undefined}
          />
          {errors.city && (
            <span id="city-error" style={styles.error} role="alert">
              {errors.city.message}
            </span>
          )}
        </div>

        <div style={styles.field}>
          <label htmlFor="zipCode" style={styles.label}>
            ZIP Code <span aria-hidden="true">*</span>
          </label>
          <input
            id="zipCode"
            {...register('zipCode', {
              required: 'ZIP code is required',
              pattern: {
                value: /^\d{5}$/,
                message: 'ZIP code must be 5 digits',
              },
            })}
            style={{
              ...styles.input,
              ...(errors.zipCode ? styles.inputError : {}),
            }}
            placeholder="10001"
            aria-invalid={!!errors.zipCode}
            aria-describedby={errors.zipCode ? 'zipCode-error' : undefined}
          />
          {errors.zipCode && (
            <span id="zipCode-error" style={styles.error} role="alert">
              {errors.zipCode.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  step: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: 600,
    color: '#333',
  },
  description: {
    margin: '0 0 24px 0',
    color: '#666',
    fontSize: '14px',
  },
  field: {
    marginBottom: '20px',
    flex: 1,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  inputError: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  error: {
    display: 'block',
    marginTop: '6px',
    fontSize: '12px',
    color: '#dc3545',
  },
};
