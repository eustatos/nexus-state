import React, { useRef, useEffect } from 'react';
import { useAtom } from '@nexus-state/react';
import { addressAtom, validateAddress, type Address } from '../store';

interface AddressStepProps {
  onBack: () => void;
  onNext: () => void;
}

export function AddressStep({ onBack, onNext }: AddressStepProps) {
  const [data, setData] = useAtom(addressAtom);
  const streetInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const zipCodeInputRef = useRef<HTMLInputElement>(null);
  const countryInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof Address) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setData({
      ...data,
      [field]: value,
      touched: { ...data.touched, [field]: true },
    });
  };

  const handleBlur = (field: keyof Address) => () => {
    const errors = validateAddress(data);
    setData({ ...data, errors, touched: { ...data.touched, [field]: true } });
  };

  const errors = validateAddress(data);
  const isValid = Object.keys(errors).length === 0;

  // Focus first error field on submit attempt
  useEffect(() => {
    if (data.touched.street && errors.street && streetInputRef.current) {
      streetInputRef.current.focus();
    } else if (data.touched.city && errors.city && cityInputRef.current) {
      cityInputRef.current.focus();
    } else if (data.touched.zipCode && errors.zipCode && zipCodeInputRef.current) {
      zipCodeInputRef.current.focus();
    } else if (data.touched.country && errors.country && countryInputRef.current) {
      countryInputRef.current.focus();
    }
  }, [errors, data.touched]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateAddress(data);
    if (Object.keys(validationErrors).length === 0) {
      onNext();
    } else {
      setData({
        ...data,
        errors: validationErrors,
        touched: {
          street: true,
          city: true,
          zipCode: true,
          country: true,
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form} aria-label="Address information form" noValidate>
      <h2 style={styles.title}>Address Information</h2>
      <p style={styles.description} id="address-description">
        Where should we send your information?
      </p>

      <div style={styles.field}>
        <label htmlFor="street" style={styles.label}>
          Street Address <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </label>
        <input
          ref={streetInputRef}
          id="street"
          name="street"
          type="text"
          value={data.street}
          onChange={handleChange('street')}
          onBlur={handleBlur('street')}
          style={{
            ...styles.input,
            ...(data.touched.street && errors.street ? styles.inputError : {}),
          }}
          placeholder="123 Main Street, Apt 4B"
          required
          aria-required="true"
          aria-invalid={data.touched.street && !!errors.street}
          aria-describedby={data.touched.street && errors.street ? 'street-error' : undefined}
          autoComplete="street-address"
        />
        {data.touched.street && errors.street && (
          <span style={styles.error} id="street-error" role="alert">
            {errors.street}
          </span>
        )}
      </div>

      <div style={styles.grid}>
        <div style={styles.field}>
          <label htmlFor="city" style={styles.label}>
            City <span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <input
            ref={cityInputRef}
            id="city"
            name="city"
            type="text"
            value={data.city}
            onChange={handleChange('city')}
            onBlur={handleBlur('city')}
            style={{
              ...styles.input,
              ...(data.touched.city && errors.city ? styles.inputError : {}),
            }}
            placeholder="New York"
            required
            aria-required="true"
            aria-invalid={data.touched.city && !!errors.city}
            aria-describedby={data.touched.city && errors.city ? 'city-error' : undefined}
            autoComplete="address-level2"
          />
          {data.touched.city && errors.city && (
            <span style={styles.error} id="city-error" role="alert">
              {errors.city}
            </span>
          )}
        </div>

        <div style={styles.field}>
          <label htmlFor="zipCode" style={styles.label}>
            ZIP Code <span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <input
            ref={zipCodeInputRef}
            id="zipCode"
            name="zipCode"
            type="text"
            value={data.zipCode}
            onChange={handleChange('zipCode')}
            onBlur={handleBlur('zipCode')}
            style={{
              ...styles.input,
              ...(data.touched.zipCode && errors.zipCode ? styles.inputError : {}),
            }}
            placeholder="10001"
            required
            aria-required="true"
            aria-invalid={data.touched.zipCode && !!errors.zipCode}
            aria-describedby={data.touched.zipCode && errors.zipCode ? 'zipCode-error' : undefined}
            autoComplete="postal-code"
          />
          {data.touched.zipCode && errors.zipCode && (
            <span style={styles.error} id="zipCode-error" role="alert">
              {errors.zipCode}
            </span>
          )}
        </div>
      </div>

      <div style={styles.field}>
        <label htmlFor="country" style={styles.label}>
          Country <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </label>
        <input
          ref={countryInputRef}
          id="country"
          name="country"
          type="text"
          value={data.country}
          onChange={handleChange('country')}
          onBlur={handleBlur('country')}
          style={{
            ...styles.input,
            ...(data.touched.country && errors.country ? styles.inputError : {}),
          }}
          placeholder="United States"
          required
          aria-required="true"
          aria-invalid={data.touched.country && !!errors.country}
          aria-describedby={data.touched.country && errors.country ? 'country-error' : undefined}
          autoComplete="country-name"
        />
        {data.touched.country && errors.country && (
          <span style={styles.error} id="country-error" role="alert">
            {errors.country}
          </span>
        )}
      </div>

      <div style={styles.actions}>
        <button type="button" onClick={onBack} style={styles.backButton}>
          ← Back
        </button>
        <button type="submit" style={styles.button}>
          Next Step →
        </button>
      </div>
    </form>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  form: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: 600,
  },
  description: {
    margin: '0 0 24px 0',
    color: '#666',
    fontSize: '14px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    transition: 'border-color 0.2s',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  error: {
    fontSize: '12px',
    color: '#dc3545',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '24px',
  },
  backButton: {
    padding: '12px 24px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#666',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  button: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#1976d2',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
