import React from 'react';
import { useAtomValue } from '@nexus-state/react';
import { submittedDataAtom } from '../store';

interface SuccessStepProps {
  onReset: () => void;
}

export function SuccessStep({ onReset }: SuccessStepProps) {
  const submittedData = useAtomValue(submittedDataAtom);

  return (
    <div style={styles.container} role="region" aria-label="Application submitted">
      <div style={styles.icon} aria-hidden="true">✅</div>
      <h1 style={styles.title}>Application Submitted!</h1>
      <p style={styles.description} id="success-message">
        Thank you for your submission. We have received your application and
        will process it shortly.
      </p>

      {submittedData && (
        <div style={styles.summary} role="region" aria-labelledby="summary-heading">
          <h3 style={styles.summaryTitle} id="summary-heading">Submission Summary</h3>
          <div style={styles.summaryContent}>
            <p>
              <strong>Name:</strong> {submittedData.personal.firstName}{' '}
              {submittedData.personal.lastName}
            </p>
            <p>
              <strong>Email:</strong> {submittedData.personal.email}
            </p>
            <p>
              <strong>Address:</strong> {submittedData.address.street},{' '}
              {submittedData.address.city}, {submittedData.address.zipCode}
            </p>
            <p>
              <strong>Newsletter:</strong>{' '}
              {submittedData.preferences.newsletter ? 'Subscribed' : 'Not subscribed'}
            </p>
          </div>
        </div>
      )}

      <div style={styles.actions}>
        <button onClick={onReset} style={styles.button}>
          Start New Application
        </button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '48px 24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '0 auto',
  },
  icon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: '28px',
    fontWeight: 700,
    color: '#2e7d32',
  },
  description: {
    margin: '0 0 32px 0',
    color: '#666',
    fontSize: '16px',
    lineHeight: 1.6,
  },
  summary: {
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '32px',
    textAlign: 'left',
  },
  summaryTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: 600,
  },
  summaryContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
  },
  button: {
    padding: '14px 32px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#1976d2',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
