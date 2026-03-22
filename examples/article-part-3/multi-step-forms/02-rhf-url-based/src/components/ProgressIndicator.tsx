import React from 'react';

interface ProgressIndicatorProps {
  current: number;
  total: number;
}

export function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <nav aria-label="Form progress" style={styles.nav}>
      <ol style={styles.steps}>
        {Array.from({ length: total }, (_, i) => {
          const stepNumber = i + 1;
          const isComplete = stepNumber < current;
          const isCurrent = stepNumber === current;
          const isFuture = stepNumber > current;

          return (
            <li
              key={i}
              style={{
                ...styles.step,
                ...(isComplete ? styles.stepComplete : {}),
                ...(isCurrent ? styles.stepCurrent : {}),
                ...(isFuture ? styles.stepFuture : {}),
              }}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div style={styles.stepContainer}>
                <span
                  style={{
                    ...styles.stepNumber,
                    ...(isComplete ? styles.stepNumberComplete : {}),
                    ...(isCurrent ? styles.stepNumberCurrent : {}),
                  }}
                  aria-hidden="true"
                >
                  {isComplete ? '✓' : stepNumber}
                </span>
                <span style={styles.stepLabel}>
                  {stepNumber === 1 && 'Personal'}
                  {stepNumber === 2 && 'Address'}
                  {stepNumber === 3 && 'Payment'}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      {/* Screen reader only update */}
      <span className="sr-only" aria-live="polite" style={styles.srOnly}>
        Step {current} of {total} ({percentage}% complete)
      </span>
    </nav>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  nav: {
    marginBottom: '32px',
  },
  steps: {
    display: 'flex',
    justifyContent: 'space-between',
    listStyle: 'none',
    padding: 0,
    margin: 0,
    counterReset: 'step',
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepComplete: {
    color: '#2e7d32',
  },
  stepCurrent: {
    color: '#1976d2',
    fontWeight: 600,
  },
  stepFuture: {
    color: '#9e9e9e',
  },
  stepContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  stepNumber: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
  },
  stepNumberComplete: {
    backgroundColor: '#2e7d32',
    color: '#fff',
  },
  stepNumberCurrent: {
    backgroundColor: '#1976d2',
    color: '#fff',
    boxShadow: '0 0 0 4px rgba(25, 118, 210, 0.3)',
  },
  stepLabel: {
    fontSize: '12px',
    textAlign: 'center',
  },
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  },
};
