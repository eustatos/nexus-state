import React, { useState } from 'react';
import { useAtomValue, useAtom } from '@nexus-state/react';
import {
  reviewDataAtom,
  submittedDataAtom,
  wizardCompletedAtom,
} from '../store';

interface ReviewStepProps {
  onBack: () => void;
  onSubmit: () => void;
}

export function ReviewStep({ onBack, onSubmit }: ReviewStepProps) {
  const review = useAtomValue(reviewDataAtom);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setSubmittedData] = useAtom(submittedDataAtom);
  const [, setWizardCompleted] = useAtom(wizardCompletedAtom);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setSubmittedData({
      personal: {
        firstName: review.personal.firstName,
        lastName: review.personal.lastName,
        email: review.personal.email,
        phone: review.personal.phone,
      },
      address: {
        street: review.address.street,
        city: review.address.city,
        zipCode: review.address.zipCode,
        country: review.address.country,
      },
      preferences: review.preferences,
    });
    
    setWizardCompleted(true);
    setIsSubmitting(false);
  };

  return (
    <div style={styles.form} role="form" aria-label="Review form">
      <h2 style={styles.title}>Review Your Information</h2>
      <p style={styles.description} id="review-description">
        Please review your information before submitting.
      </p>

      <div style={styles.section} role="region" aria-labelledby="personal-info-heading">
        <h3 style={styles.sectionTitle} id="personal-info-heading">
          <span style={styles.sectionIcon} aria-hidden="true">👤</span> Personal Information
        </h3>
        <div style={styles.info} role="list">
          <div style={styles.infoRow} role="listitem">
            <span style={styles.infoLabel}>Name:</span>
            <span style={styles.infoValue}>
              {review.personal.firstName} {review.personal.lastName}
            </span>
          </div>
          <div style={styles.infoRow} role="listitem">
            <span style={styles.infoLabel}>Email:</span>
            <span style={styles.infoValue}>{review.personal.email}</span>
          </div>
          <div style={styles.infoRow} role="listitem">
            <span style={styles.infoLabel}>Phone:</span>
            <span style={styles.infoValue}>{review.personal.phone}</span>
          </div>
        </div>
      </div>

      <div style={styles.section} role="region" aria-labelledby="address-heading">
        <h3 style={styles.sectionTitle} id="address-heading">
          <span style={styles.sectionIcon} aria-hidden="true">🏠</span> Address
        </h3>
        <div style={styles.info} role="list">
          <div style={styles.infoRow} role="listitem">
            <span style={styles.infoLabel}>Street:</span>
            <span style={styles.infoValue}>{review.address.street}</span>
          </div>
          <div style={styles.infoRow} role="listitem">
            <span style={styles.infoLabel}>City:</span>
            <span style={styles.infoValue}>{review.address.city}</span>
          </div>
          <div style={styles.infoRow} role="listitem">
            <span style={styles.infoLabel}>ZIP Code:</span>
            <span style={styles.infoValue}>{review.address.zipCode}</span>
          </div>
          <div style={styles.infoRow} role="listitem">
            <span style={styles.infoLabel}>Country:</span>
            <span style={styles.infoValue}>{review.address.country}</span>
          </div>
        </div>
      </div>

      <div style={styles.section} role="region" aria-labelledby="preferences-heading">
        <h3 style={styles.sectionTitle} id="preferences-heading">
          <span style={styles.sectionIcon} aria-hidden="true">⚙️</span> Preferences
        </h3>
        <div style={styles.info} role="list">
          <div style={styles.infoRow} role="listitem">
            <span style={styles.infoLabel}>Newsletter:</span>
            <span style={styles.infoValue}>
              {review.preferences.newsletter ? '✅ Subscribed' : '❌ Not subscribed'}
            </span>
          </div>
          <div style={styles.infoRow} role="listitem">
            <span style={styles.infoLabel}>Notifications:</span>
            <span style={styles.infoValue}>
              {review.preferences.notifications ? '✅ Enabled' : '❌ Disabled'}
            </span>
          </div>
          <div style={styles.infoRow} role="listitem">
            <span style={styles.infoLabel}>Theme:</span>
            <span style={styles.infoValue}>
              {review.preferences.theme === 'light' && '☀️ Light'}
              {review.preferences.theme === 'dark' && '🌙 Dark'}
              {review.preferences.theme === 'system' && '💻 System'}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <button type="button" onClick={onBack} style={styles.backButton}>
          ← Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            ...styles.button,
            ...(isSubmitting ? styles.buttonDisabled : {}),
          }}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : '✓ Submit Application'}
        </button>
      </div>
    </div>
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
  section: {
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e0e0e0',
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionIcon: {
    fontSize: '18px',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  infoRow: {
    display: 'flex',
    gap: '16px',
  },
  infoLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#666',
    minWidth: '100px',
  },
  infoValue: {
    fontSize: '14px',
    color: '#333',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '24px',
  },
  backButton: {
    padding: '12px 24px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#666',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  button: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#2e7d32',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
    cursor: 'not-allowed',
  },
};
