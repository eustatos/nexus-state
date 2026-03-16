import { parseDSL } from '@nexus-state/form-schema-dsl/parser';
import { createForm } from '@nexus-state/form';
import { useForm } from '@nexus-state/form/react';

// Text-based DSL schema
const registrationDSL = `
# User Registration Form
username: required, min:3, max:20, alphanumeric, unique:users.username
email: required, email, unique:users.email
password: required, min:8, uppercase, lowercase, number, special
confirmPassword: required, same:password
age: required, minvalue:18, maxvalue:120
terms: required, equals:true
`;

// Parse DSL to schema
const { schema, errors } = parseDSL(registrationDSL);

if (errors.length > 0) {
  console.error('DSL Parsing errors:', errors);
}

// Create form with parsed schema
const registrationForm = createForm(schema, {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  age: 0,
  terms: false,
});

// React component
export function RegistrationForm() {
  const form = useForm(registrationForm);
  const { values, errors: formErrors, isSubmitting } = form;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await registrationForm.submit();
    
    if (result.success) {
      console.log('Success:', result.data);
      alert('Registration successful!');
    } else {
      console.log('Errors:', result.errors);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 500, margin: '0 auto' }}>
      <h2>Register</h2>
      <p style={{ color: '#666', fontSize: 12 }}>
        Schema defined with text-based DSL
      </p>
      
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="username" style={{ display: 'block', marginBottom: 4 }}>
          Username
        </label>
        <input
          id="username"
          type="text"
          value={values.username}
          onChange={(e) => registrationForm.setField('username', e.target.value)}
          style={{
            width: '100%',
            padding: 8,
            border: formErrors.username ? '1px solid red' : '1px solid #ccc',
            borderRadius: 4,
          }}
        />
        {formErrors.username && (
          <span style={{ color: 'red', fontSize: 12 }}>{formErrors.username}</span>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="email" style={{ display: 'block', marginBottom: 4 }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={values.email}
          onChange={(e) => registrationForm.setField('email', e.target.value)}
          style={{
            width: '100%',
            padding: 8,
            border: formErrors.email ? '1px solid red' : '1px solid #ccc',
            borderRadius: 4,
          }}
        />
        {formErrors.email && (
          <span style={{ color: 'red', fontSize: 12 }}>{formErrors.email}</span>
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
          onChange={(e) => registrationForm.setField('password', e.target.value)}
          style={{
            width: '100%',
            padding: 8,
            border: formErrors.password ? '1px solid red' : '1px solid #ccc',
            borderRadius: 4,
          }}
        />
        {formErrors.password && (
          <span style={{ color: 'red', fontSize: 12 }}>{formErrors.password}</span>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: 4 }}>
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={values.confirmPassword}
          onChange={(e) => registrationForm.setField('confirmPassword', e.target.value)}
          style={{
            width: '100%',
            padding: 8,
            border: formErrors.confirmPassword ? '1px solid red' : '1px solid #ccc',
            borderRadius: 4,
          }}
        />
        {formErrors.confirmPassword && (
          <span style={{ color: 'red', fontSize: 12 }}>{formErrors.confirmPassword}</span>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="age" style={{ display: 'block', marginBottom: 4 }}>
          Age
        </label>
        <input
          id="age"
          type="number"
          value={values.age}
          onChange={(e) => registrationForm.setField('age', parseInt(e.target.value, 10))}
          style={{
            width: '100%',
            padding: 8,
            border: formErrors.age ? '1px solid red' : '1px solid #ccc',
            borderRadius: 4,
          }}
        />
        {formErrors.age && (
          <span style={{ color: 'red', fontSize: 12 }}>{formErrors.age}</span>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={values.terms}
            onChange={(e) => registrationForm.setField('terms', e.target.checked)}
          />
          I accept the terms and conditions
        </label>
        {formErrors.terms && (
          <span style={{ color: 'red', fontSize: 12 }}>{formErrors.terms}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          width: '100%',
          padding: 12,
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
        }}
      >
        {isSubmitting ? 'Submitting...' : 'Register'}
      </button>
    </form>
  );
}
