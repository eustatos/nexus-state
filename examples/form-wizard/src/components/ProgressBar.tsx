import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div style={styles.container} role="region" aria-label="Form progress">
      <div
        style={styles.track}
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-label={`Step ${currentStep} of ${totalSteps}`}
      >
        <div style={{ ...styles.fill, width: `${percentage}%` }} />
      </div>
      <div style={styles.steps} role="list" aria-label="Form steps">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            style={{
              ...styles.step,
              ...(step <= currentStep ? styles.stepActive : {}),
              ...(step === currentStep ? styles.stepCurrent : {}),
            }}
            role="listitem"
          >
            <div
              style={styles.stepNumber}
              aria-current={step === currentStep ? 'step' : undefined}
              aria-label={`Step ${step}: ${getStepLabel(step)}`}
            >
              {step < currentStep ? '✓' : step}
            </div>
            <span style={styles.stepLabel}>{getStepLabel(step)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getStepLabel(step: number): string {
  switch (step) {
    case 1:
      return 'Personal Info';
    case 2:
      return 'Address';
    case 3:
      return 'Preferences';
    case 4:
      return 'Review';
    default:
      return '';
  }
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginBottom: '32px',
  },
  track: {
    height: '4px',
    backgroundColor: '#e0e0e0',
    borderRadius: '2px',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#1976d2',
    transition: 'width 0.3s ease',
  },
  steps: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    position: 'relative',
  },
  stepActive: {
    color: '#1976d2',
  },
  stepCurrent: {
    fontWeight: 600,
  },
  stepNumber: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'background-color 0.3s ease, color 0.3s ease',
  },
  stepLabel: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'center',
  },
};
