import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { FullFormData } from '../schemas';

interface Step1Props {
  register: UseFormRegister<FullFormData>;
  errors: FieldErrors<FullFormData>;
  onFieldChange?: (field: keyof FullFormData, value: string) => void;
}

export function Step1({ register, errors, onFieldChange }: Step1Props) {
  return (
    <div style={styles.step}>
      <h2 style={styles.title}>Step 1: Personal Information</h2>
      <p style={styles.description}>
        Please provide your basic information to get started.
      </p>

      <div style={styles.field}>
        <label htmlFor="firstName" style={styles.label}>
          First Name <span aria-hidden="true">*</span>
        </label>
        <input
          id="firstName"
          {...register('firstName', { required: 'First name is required' })}
          onChange={(e) => onFieldChange?.('firstName', e.target.value)}
          style={{
            ...styles.input,
            ...(errors.firstName ? styles.inputError : {}),
          }}
          placeholder="John"
          aria-invalid={!!errors.firstName}
          aria-describedby={errors.firstName ? 'firstName-error' : undefined}
        />
        {errors.firstName && (
          <span id="firstName-error" style={styles.error} role="alert">
            {errors.firstName.message}
          </span>
        )}
      </div>

      <div style={styles.field}>
        <label htmlFor="lastName" style={styles.label}>
          Last Name <span aria-hidden="true">*</span>
        </label>
        <input
          id="lastName"
          {...register('lastName', { required: 'Last name is required' })}
          onChange={(e) => onFieldChange?.('lastName', e.target.value)}
          style={{
            ...styles.input,
            ...(errors.lastName ? styles.inputError : {}),
          }}
          placeholder="Doe"
          aria-invalid={!!errors.lastName}
          aria-describedby={errors.lastName ? 'lastName-error' : undefined}
        />
        {errors.lastName && (
          <span id="lastName-error" style={styles.error} role="alert">
            {errors.lastName.message}
          </span>
        )}
      </div>

      <div style={styles.field}>
        <label htmlFor="email" style={styles.label}>
          Email Address <span aria-hidden="true">*</span>
        </label>
        <input
          id="email"
          type="email"
          {...register('email', { required: 'Email is required' })}
          onChange={(e) => onFieldChange?.('email', e.target.value)}
          style={{
            ...styles.input,
            ...(errors.email ? styles.inputError : {}),
          }}
          placeholder="john.doe@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span id="email-error" style={styles.error} role="alert">
            {errors.email.message}
          </span>
        )}
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
