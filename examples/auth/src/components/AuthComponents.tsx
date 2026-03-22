import React, { useState } from 'react';
import { useSetAtom, useAtomValue } from '@nexus-state/react';
import { useMutation } from '@nexus-state/query/react';
import { tokenAtom, authService, userAtom, validateLogin, type LoginFormData } from '../store';

export function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: 'demo@example.com',
    password: 'password',
  });
  const [touched, setTouched] = useState<Partial<Record<keyof LoginFormData, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const setToken = useSetAtom(tokenAtom);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const token = await authService.login(formData.email, formData.password);
      return token;
    },
    onSuccess: (token) => {
      setToken(token);
    },
  });

  const handleChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleBlur = (field: keyof LoginFormData) => () => {
    setTouched({ ...touched, [field]: true });
    const validationErrors = validateLogin(formData);
    setErrors(validationErrors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateLogin(formData);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTouched({ email: true, password: true });
      return;
    }
    
    loginMutation.mutate();
  };

  const hasError = loginMutation.status === 'error';
  const errorMessage = hasError ? (loginMutation.error as Error).message : '';

  return (
    <form onSubmit={handleSubmit} style={styles.form} aria-label="Login form" noValidate>
      <h2 style={styles.title}>Login</h2>

      <div style={styles.field}>
        <label htmlFor="email" style={styles.label}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          onBlur={handleBlur('email')}
          style={{
            ...styles.input,
            ...(touched.email && errors.email ? styles.inputError : {}),
          }}
          required
          aria-required="true"
          aria-invalid={touched.email && !!errors.email}
          aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
          autoComplete="email"
          placeholder="Enter your email"
        />
        {touched.email && errors.email && (
          <span style={styles.error} id="email-error" role="alert">
            {errors.email}
          </span>
        )}
      </div>

      <div style={styles.field}>
        <label htmlFor="password" style={styles.label}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange('password')}
          onBlur={handleBlur('password')}
          style={{
            ...styles.input,
            ...(touched.password && errors.password ? styles.inputError : {}),
          }}
          required
          aria-required="true"
          aria-invalid={touched.password && !!errors.password}
          aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
          autoComplete="current-password"
          placeholder="Enter your password"
        />
        {touched.password && errors.password && (
          <span style={styles.error} id="password-error" role="alert">
            {errors.password}
          </span>
        )}
      </div>

      {hasError && (
        <div role="alert" aria-live="assertive" style={styles.error}>
          Error: {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={loginMutation.status === 'pending'}
        style={styles.button}
        aria-busy={loginMutation.status === 'pending'}
      >
        {loginMutation.status === 'pending' ? 'Logging in...' : 'Login'}
      </button>

      <p style={styles.hint} id="login-hint">
        Hint: demo@example.com / password
      </p>
    </form>
  );
}

export function UserProfile() {
  const user = useAtomValue(userAtom);
  const setToken = useSetAtom(tokenAtom);

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      setToken(null);
    },
  });

  if (!user) return null;

  return (
    <div style={styles.profile} role="region" aria-label="User profile">
      <h2 style={styles.title}>Welcome, {user.name}!</h2>
      <p style={styles.email}>{user.email}</p>
      <button
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.status === 'pending'}
        style={styles.button}
        aria-busy={logoutMutation.status === 'pending'}
      >
        {logoutMutation.status === 'pending' ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '320px',
    padding: '24px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '24px',
    textAlign: 'center',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '16px',
  },
  button: {
    padding: '12px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#007bff',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    color: '#dc3545',
    fontSize: '14px',
    margin: '8px 0 0 0',
  },
  hint: {
    color: '#6c757d',
    fontSize: '12px',
    margin: '8px 0 0 0',
    textAlign: 'center',
  },
  profile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '24px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
  email: {
    color: '#6c757d',
    margin: 0,
  },
};
