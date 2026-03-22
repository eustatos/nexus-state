import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ProgressIndicator } from './components/ProgressIndicator';
import { Step1 } from './components/Step1';
import { Step2 } from './components/Step2';
import { Step3 } from './components/Step3';
import {
  getStepSchema,
  type FullFormData,
  initialFormData,
} from './schemas';
import {
  loadFromStorage,
  saveToStorage,
  clearFormData,
  STORAGE_KEY,
  STORAGE_STEP_KEY,
} from './utils/storage';

const TOTAL_STEPS = 3;

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get step from URL
  const stepParam = searchParams.get('step');
  const step = stepParam ? parseInt(stepParam, 10) : 1;

  // Load saved data from localStorage on mount
  const [formData, setFormData] = useState<FullFormData>(() => {
    const savedData = loadFromStorage<FullFormData>(STORAGE_KEY);
    const savedStep = loadFromStorage<number>(STORAGE_STEP_KEY);
    
    console.log('Loaded from storage:', { savedData, savedStep });
    
    return {
      ...initialFormData,
      ...(savedData || {}),
    };
  });

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
    getValues,
    setValue,
  } = useForm<FullFormData>({
    mode: 'onChange',
    resolver: zodResolver(getStepSchema(step)),
    defaultValues: formData,
  });

  // Sync form values with state
  useEffect(() => {
    Object.keys(formData).forEach((key) => {
      const typedKey = key as keyof FullFormData;
      if (formData[typedKey] !== getValues(typedKey)) {
        setValue(typedKey, formData[typedKey]);
      }
    });
  }, []); // Run once on mount

  // Save data and step on every change
  useEffect(() => {
    const values = getValues();
    saveToStorage(STORAGE_KEY, values);
    saveToStorage(STORAGE_STEP_KEY, step);
    console.log('Saved to storage:', { step, values });
  }, [formData, step]);

  // Validate step bounds and prevent jumping to unauthorized steps
  useEffect(() => {
    const maxReachableStep = calculateMaxReachableStep(formData);

    if (isNaN(step) || step < 1 || step > TOTAL_STEPS) {
      goToStep(1);
    } else if (step > maxReachableStep) {
      // Don't allow jumping to unvalidated steps
      console.log('Prevented jump to step', step, 'max reachable:', maxReachableStep);
      goToStep(maxReachableStep);
    }
  }, [step, formData]); // Added formData dependency

  const goToStep = (newStep: number) => {
    setSearchParams({ step: newStep.toString() });
  };

  // Check if step data is valid using Zod schema parsing
  const isStepValid = (stepNum: number, data: FullFormData): boolean => {
    const schema = getStepSchema(stepNum);
    const stepData: Partial<FullFormData> = {};
    
    // Extract fields for this step
    const fields = getFieldsForStep(stepNum);
    fields.forEach(field => {
      stepData[field] = data[field];
    });
    
    const result = schema.safeParse(stepData);
    return result.success;
  };

  const calculateMaxReachableStep = (data: FullFormData): number => {
    let maxStep = 1;
    
    // Check if step 1 is valid (not just filled, but VALID)
    if (isStepValid(1, data)) {
      maxStep = 2;
    }
    
    // Check if step 2 is valid
    if (isStepValid(2, data)) {
      maxStep = 3;
    }
    
    // Check if step 3 is valid
    if (isStepValid(3, data)) {
      maxStep = TOTAL_STEPS;
    }
    
    return maxStep;
  };

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
      // Save current form data before navigating
      const values = getValues();
      setFormData(values);
      goToStep(step + 1);
    }
  };

  const onPrev = () => {
    if (step > 1) {
      goToStep(step - 1);
    }
  };

  const onSubmit: SubmitHandler<FullFormData> = async (data) => {
    console.log('Form submitted:', data);
    // Clear storage on successful submission
    clearFormData();
    // Navigate to success or show success message
    alert('Form submitted successfully!\n\nCheck console for data.');
  };

  // Update form data when values change
  const handleFieldChange = (field: keyof FullFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Multi-Step Form Demo (URL-based)</h1>
        <p>React Hook Form + Zod + React Router + localStorage</p>
        <p style={styles.urlInfo}>
          Current URL: <code>?step={step}</code>
        </p>
      </header>

      <main style={styles.main}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <ProgressIndicator current={step} total={TOTAL_STEPS} />

          {step === 1 && (
            <Step1
              register={register}
              errors={errors}
              onFieldChange={handleFieldChange}
            />
          )}
          {step === 2 && (
            <Step2
              register={register}
              errors={errors}
              onFieldChange={handleFieldChange}
            />
          )}
          {step === 3 && (
            <Step3
              register={register}
              errors={errors}
              onFieldChange={handleFieldChange}
            />
          )}

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
        <p style={styles.featureNote}>
          ✨ Try refreshing the page - your data persists!
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
  urlInfo: {
    marginTop: '8px',
    fontSize: '14px',
    color: '#1976d2',
    backgroundColor: '#e3f2fd',
    padding: '8px 12px',
    borderRadius: '4px',
    display: 'inline-block',
  },
  featureNote: {
    marginTop: '8px',
    fontSize: '14px',
    color: '#2e7d32',
    fontStyle: 'italic',
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
};

export default App;
