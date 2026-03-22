import React, { useRef, useEffect } from 'react';
import { useAtom } from '@nexus-state/react';
import { personalInfoAtom, validatePersonalInfo, type PersonalInfo } from '../store';

interface PersonalInfoStepProps {
  onNext: () => void;
}

export function PersonalInfoStep({ onNext }: PersonalInfoStepProps) {
  const [data, setData] = useAtom(personalInfoAtom);
  const firstNameInputRef = useRef<HTMLInputElement>(null);
  const lastNameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof PersonalInfo) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setData({
      ...data,
      [field]: value,
      touched: { ...data.touched, [field]: true },
    });
  };

  const handleBlur = (field: keyof PersonalInfo) => () => {
    const errors = validatePersonalInfo(data);
    setData({ ...data, errors, touched: { ...data.touched, [field]: true } });
  };

  const errors = validatePersonalInfo(data);
  const isValid = Object.keys(errors).length === 0;

  // Focus first error field on submit attempt
  useEffect(() => {
    if (data.touched.firstName && errors.firstName && firstNameInputRef.current) {
      firstNameInputRef.current.focus();
    } else if (data.touched.lastName && errors.lastName && lastNameInputRef.current) {
      lastNameInputRef.current.focus();
    } else if (data.touched.email && errors.email && emailInputRef.current) {
      emailInputRef.current.focus();
    } else if (data.touched.phone && errors.phone && phoneInputRef.current) {
      phoneInputRef.current.focus();
    }
  }, [errors, data.touched]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validatePersonalInfo(data);
    if (Object.keys(validationErrors).length === 0) {
      onNext();
    } else {
      setData({ ...data, errors: validationErrors, touched: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      }});
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form} aria-label="Personal information form" noValidate>
      <h2 style={styles.title}>Personal Information</h2>
      <p style={styles.description} id="personal-info-description">
        Please provide your basic information to get started.
      </p>

      <div style={styles.grid}>
        <div style={styles.field}>
          <label htmlFor="firstName" style={styles.label}>
            First Name <span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <input
            ref={firstNameInputRef}
            id="firstName"
            name="firstName"
            type="text"
            value={data.firstName}
            onChange={handleChange('firstName')}
            onBlur={handleBlur('firstName')}
            style={{
              ...styles.input,
              ...(data.touched.firstName && errors.firstName ? styles.inputError : {}),
            }}
            placeholder="John"
            required
            aria-required="true"
            aria-invalid={data.touched.firstName && !!errors.firstName}
            aria-describedby={data.touched.firstName && errors.firstName ? 'firstName-error' : undefined}
            autoComplete="given-name"
          />
          {data.touched.firstName && errors.firstName && (
            <span style={styles.error} id="firstName-error" role="alert">
              {errors.firstName}
            </span>
          )}
        </div>

        <div style={styles.field}>
          <label htmlFor="lastName" style={styles.label}>
            Last Name <span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <input
            ref={lastNameInputRef}
            id="lastName"
            name="lastName"
            type="text"
            value={data.lastName}
            onChange={handleChange('lastName')}
            onBlur={handleBlur('lastName')}
            style={{
              ...styles.input,
              ...(data.touched.lastName && errors.lastName ? styles.inputError : {}),
            }}
            placeholder="Doe"
            required
            aria-required="true"
            aria-invalid={data.touched.lastName && !!errors.lastName}
            aria-describedby={data.touched.lastName && errors.lastName ? 'lastName-error' : undefined}
            autoComplete="family-name"
          />
          {data.touched.lastName && errors.lastName && (
            <span style={styles.error} id="lastName-error" role="alert">
              {errors.lastName}
            </span>
          )}
        </div>
      </div>

      <div style={styles.field}>
        <label htmlFor="email" style={styles.label}>
          Email Address <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </label>
        <input
          ref={emailInputRef}
          id="email"
          name="email"
          type="email"
          value={data.email}
          onChange={handleChange('email')}
          onBlur={handleBlur('email')}
          style={{
            ...styles.input,
            ...(data.touched.email && errors.email ? styles.inputError : {}),
          }}
          placeholder="john.doe@example.com"
          required
          aria-required="true"
          aria-invalid={data.touched.email && !!errors.email}
          aria-describedby={data.touched.email && errors.email ? 'email-error' : undefined}
          autoComplete="email"
        />
        {data.touched.email && errors.email && (
          <span style={styles.error} id="email-error" role="alert">
            {errors.email}
          </span>
        )}
      </div>

      <div style={styles.field}>
        <label htmlFor="phone" style={styles.label}>
          Phone Number <span aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </label>
        <input
          ref={phoneInputRef}
          id="phone"
          name="phone"
          type="tel"
          value={data.phone}
          onChange={handleChange('phone')}
          onBlur={handleBlur('phone')}
          style={{
            ...styles.input,
            ...(data.touched.phone && errors.phone ? styles.inputError : {}),
          }}
          placeholder="+1 (555) 123-4567"
          required
          aria-required="true"
          aria-invalid={data.touched.phone && !!errors.phone}
          aria-describedby={data.touched.phone && errors.phone ? 'phone-error' : undefined}
          autoComplete="tel"
        />
        {data.touched.phone && errors.phone && (
          <span style={styles.error} id="phone-error" role="alert">
            {errors.phone}
          </span>
        )}
      </div>

      <div style={styles.actions}>
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
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
    justifyContent: 'flex-end',
    marginTop: '24px',
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
