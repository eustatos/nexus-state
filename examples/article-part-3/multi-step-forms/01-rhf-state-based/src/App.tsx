import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProgressIndicator } from './components/ProgressIndicator';
import { Step1 } from './components/Step1';
import { Step2 } from './components/Step2';
import { Step3 } from './components/Step3';
import { getStepSchema, type FullFormData } from './schemas';

const TOTAL_STEPS = 3;

function App() {
  const [step, setStep] = useState(1);
  const [submittedData, setSubmittedData] = useState<FullFormData | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<FullFormData>({
    mode: 'onChange',
    resolver: zodResolver(getStepSchema(step)),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      street: '',
      city: '',
      zipCode: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    },
  });

  const validateCurrentStep = async (): Promise<boolean> => {
    const fields = getFieldsForStep(step);
    return await trigger(fields, { shouldFocus: true });
  };

  const getFieldsForStep = (currentStep: number): (keyof FullFormData)[] => {
    switch (currentStep) {
      case 1:
        return ['firstName', 'lastName', 'email'];
      case 2:
        return ['street', 'city', 'zipCode'];
      case 3:
        return ['cardNumber', 'expiryDate', 'cvv'];
      default:
        return [];
    }
  };

  const onNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const onPrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const onSubmit: SubmitHandler<FullFormData> = async (data) => {
    console.log('Form submitted:', data);
    setSubmittedData(data);
  };

  // Show success message after submission
  if (submittedData) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <h1>✅ Registration Complete!</h1>
        </header>
        <main style={styles.main}>
          <div style={styles.successCard}>
            <h2>Thank you for your registration!</h2>
            <p>Your information has been submitted successfully.</p>
            <div style={styles.summary}>
              <h3>Submitted Information:</h3>
              <div style={styles.summarySection}>
                <strong>Personal:</strong> {submittedData.firstName} {submittedData.lastName} ({submittedData.email})
              </div>
              <div style={styles.summarySection}>
                <strong>Address:</strong> {submittedData.street}, {submittedData.city} {submittedData.zipCode}
              </div>
              <div style={styles.summarySection}>
                <strong>Payment:</strong> Card ending in {submittedData.cardNumber.slice(-4)}
              </div>
            </div>
            <button onClick={() => window.location.reload()} style={styles.resetButton}>
              Start Over
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Multi-Step Form Demo</h1>
        <p>React Hook Form + Zod (State-based approach)</p>
      </header>

      <main style={styles.main}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <ProgressIndicator current={step} total={TOTAL_STEPS} />

          {step === 1 && <Step1 register={register} errors={errors} />}
          {step === 2 && <Step2 register={register} errors={errors} />}
          {step === 3 && <Step3 register={register} errors={errors} />}

          <div style={styles.actions}>
            {step > 1 && (
              <button
                type="button"
                onClick={onPrev}
                style={styles.backButton}
              >
                ← Previous
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={onNext}
                style={styles.nextButton}
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...styles.submitButton,
                  ...(isSubmitting ? styles.buttonDisabled : {}),
                }}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </form>
      </main>

      <footer style={styles.footer}>
        <p>
          Demo for "React Forms Deep Dive: Part 3" article on Dev.to
        </p>
      </footer>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: '24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #ddd',
    textAlign: 'center',
  },
  main: {
    flex: 1,
    padding: '24px',
    maxWidth: '600px',
    width: '100%',
    margin: '0 auto',
  },
  footer: {
    padding: '16px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
    borderTop: '1px solid #ddd',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '24px',
    gap: '12px',
  },
  backButton: {
    padding: '12px 24px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#666',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  nextButton: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#1976d2',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  submitButton: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#2e7d32',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
    cursor: 'not-allowed',
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  summary: {
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '24px',
    textAlign: 'left',
  },
  summarySection: {
    marginBottom: '12px',
    fontSize: '14px',
  },
  resetButton: {
    marginTop: '24px',
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

export default App;
