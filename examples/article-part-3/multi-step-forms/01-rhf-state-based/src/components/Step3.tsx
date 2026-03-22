import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { Step3FormData } from '../schemas';

interface Step3Props {
  register: UseFormRegister<Step3FormData>;
  errors: FieldErrors<Step3FormData>;
}

export function Step3({ register, errors }: Step3Props) {
  return (
    <div style={styles.step}>
      <h2 style={styles.title}>Step 3: Payment Information</h2>
      <p style={styles.description}>
        Enter your payment details securely.
      </p>

      <div style={styles.field}>
        <label htmlFor="cardNumber" style={styles.label}>
          Card Number <span aria-hidden="true">*</span>
        </label>
        <input
          id="cardNumber"
          {...register('cardNumber', {
            required: 'Card number is required',
            pattern: {
              value: /^\d{16}$/,
              message: 'Card number must be 16 digits',
            },
          })}
          style={{
            ...styles.input,
            ...(errors.cardNumber ? styles.inputError : {}),
          }}
          placeholder="1234567890123456"
          maxLength={16}
          aria-invalid={!!errors.cardNumber}
          aria-describedby={errors.cardNumber ? 'cardNumber-error' : undefined}
        />
        {errors.cardNumber && (
          <span id="cardNumber-error" style={styles.error} role="alert">
            {errors.cardNumber.message}
          </span>
        )}
      </div>

      <div style={styles.row}>
        <div style={styles.field}>
          <label htmlFor="expiryDate" style={styles.label}>
            Expiry Date <span aria-hidden="true">*</span>
          </label>
          <input
            id="expiryDate"
            {...register('expiryDate', {
              required: 'Expiry date is required',
              pattern: {
                value: /^\d{2}\/\d{2}$/,
                message: 'Format: MM/YY',
              },
            })}
            style={{
              ...styles.input,
              ...(errors.expiryDate ? styles.inputError : {}),
            }}
            placeholder="MM/YY"
            maxLength={5}
            aria-invalid={!!errors.expiryDate}
            aria-describedby={errors.expiryDate ? 'expiryDate-error' : undefined}
          />
          {errors.expiryDate && (
            <span id="expiryDate-error" style={styles.error} role="alert">
              {errors.expiryDate.message}
            </span>
          )}
        </div>

        <div style={styles.field}>
          <label htmlFor="cvv" style={styles.label}>
            CVV <span aria-hidden="true">*</span>
          </label>
          <input
            id="cvv"
            type="password"
            {...register('cvv', {
              required: 'CVV is required',
              pattern: {
                value: /^\d{3,4}$/,
                message: 'CVV must be 3 or 4 digits',
              },
            })}
            style={{
              ...styles.input,
              ...(errors.cvv ? styles.inputError : {}),
            }}
            placeholder="123"
            maxLength={4}
            aria-invalid={!!errors.cvv}
            aria-describedby={errors.cvv ? 'cvv-error' : undefined}
          />
          {errors.cvv && (
            <span id="cvv-error" style={styles.error} role="alert">
              {errors.cvv.message}
            </span>
          )}
        </div>
      </div>

      <div style={styles.notice}>
        <span style={styles.noticeIcon}>🔒</span>
        <span>Your payment information is secure and encrypted</span>
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
  notice: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
    padding: '12px',
    backgroundColor: '#e8f5e9',
    borderRadius: '6px',
    color: '#2e7d32',
    fontSize: '14px',
  },
  noticeIcon: {
    fontSize: '16px',
  },
};
