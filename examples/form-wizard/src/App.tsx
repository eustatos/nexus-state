import React from 'react';
import { useAtom, useAtomValue } from '@nexus-state/react';
import { wizardStepAtom, wizardCompletedAtom } from './store';
import {
  ProgressBar,
  PersonalInfoStep,
  AddressStep,
  PreferencesStep,
  ReviewStep,
  SuccessStep,
} from './components';

function Wizard() {
  const [step, setStep] = useAtom(wizardStepAtom);
  const completed = useAtomValue(wizardCompletedAtom);
  const totalSteps = 4;

  const handleReset = () => {
    setStep(1);
  };

  if (completed) {
    return <SuccessStep onReset={handleReset} />;
  }

  return (
    <div>
      <ProgressBar currentStep={step} totalSteps={totalSteps} />

      {step === 1 && <PersonalInfoStep onNext={() => setStep(2)} />}
      {step === 2 && (
        <AddressStep onBack={() => setStep(1)} onNext={() => setStep(3)} />
      )}
      {step === 3 && (
        <PreferencesStep onBack={() => setStep(2)} onNext={() => setStep(4)} />
      )}
      {step === 4 && (
        <ReviewStep onBack={() => setStep(3)} onSubmit={() => {}} />
      )}
    </div>
  );
}

function App() {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>📝 Nexus Form Wizard</h1>
        <p style={styles.subtitle}>
          Multi-step form with validation using @nexus-state/form and Zod
        </p>
      </header>

      <main style={styles.main}>
        <Wizard />
      </main>

      <footer style={styles.footer}>
        <p>
          Built with @nexus-state/core, @nexus-state/react, @nexus-state/form,
          Zod
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
    backgroundColor: '#f0f2f5',
  },
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #ddd',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '24px',
    textAlign: 'center',
  },
  logo: {
    margin: '0 0 8px 0',
    fontSize: '28px',
  },
  subtitle: {
    margin: 0,
    color: '#666',
    fontSize: '14px',
  },
  main: {
    flex: 1,
    padding: '24px',
    maxWidth: '700px',
    width: '100%',
    margin: '0 auto',
  },
  footer: {
    padding: '16px',
    textAlign: 'center',
    color: '#6c757d',
    fontSize: '14px',
    borderTop: '1px solid #ddd',
  },
};

export default App;
