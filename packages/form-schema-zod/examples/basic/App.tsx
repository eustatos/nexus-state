import { z } from 'zod';
import { createForm } from '@nexus-state/form';
import { useForm } from '@nexus-state/form/react';

// Define schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Create form atom
const loginForm = createForm(loginSchema, {
  email: '',
  password: '',
});

// React component
export function LoginForm() {
  const form = useForm(loginForm);
  const { values, errors, isSubmitting } = form;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await loginForm.submit();
    
    if (result.success) {
      console.log('Success:', result.data);
      alert('Login successful!');
    } else {
      console.log('Errors:', result.errors);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>Login</h2>
      
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="email" style={{ display: 'block', marginBottom: 4 }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={values.email}
          onChange={(e) => loginForm.setField('email', e.target.value)}
          style={{
            width: '100%',
            padding: 8,
            border: errors.email ? '1px solid red' : '1px solid #ccc',
            borderRadius: 4,
          }}
        />
        {errors.email && (
          <span style={{ color: 'red', fontSize: 12 }}>{errors.email}</span>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="password" style={{ display: 'block', marginBottom: 4 }}>
          Password
        </label>
        <input
          id="password"
          type="password"
          value={values.password}
          onChange={(e) => loginForm.setField('password', e.target.value)}
          style={{
            width: '100%',
            padding: 8,
            border: errors.password ? '1px solid red' : '1px solid #ccc',
            borderRadius: 4,
          }}
        />
        {errors.password && (
          <span style={{ color: 'red', fontSize: 12 }}>{errors.password}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          width: '100%',
          padding: 12,
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
        }}
      >
        {isSubmitting ? 'Submitting...' : 'Login'}
      </button>
    </form>
  );
}
