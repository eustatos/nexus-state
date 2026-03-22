import React from 'react';
import { useAtom } from '@nexus-state/react';
import { preferencesAtom, type Preferences } from '../store';

interface PreferencesStepProps {
  onBack: () => void;
  onNext: () => void;
}

export function PreferencesStep({ onBack, onNext }: PreferencesStepProps) {
  const [data, setData] = useAtom(preferencesAtom);

  const handleToggle = (field: 'newsletter' | 'notifications') => () => {
    setData({
      ...data,
      [field]: !data[field],
    });
  };

  const handleThemeChange = (theme: Preferences['theme']) => () => {
    setData({
      ...data,
      theme,
    });
  };

  return (
    <div style={styles.form} role="form" aria-label="Preferences form">
      <h2 style={styles.title}>Preferences</h2>
      <p style={styles.description} id="preferences-description">
        Customize your experience to your liking.
      </p>

      <div style={styles.section} role="group" aria-labelledby="notifications-heading">
        <h3 style={styles.sectionTitle} id="notifications-heading">Notifications</h3>

        <label style={styles.toggle}>
          <div style={styles.toggleContent}>
            <span style={styles.toggleLabel}>Email Newsletter</span>
            <span style={styles.toggleDescription}>
              Receive weekly updates and tips
            </span>
          </div>
          <input
            type="checkbox"
            id="newsletter"
            name="newsletter"
            checked={data.newsletter}
            onChange={handleToggle('newsletter')}
            style={styles.checkbox}
            aria-describedby="newsletter-description"
          />
          <span style={{
            ...styles.switch,
            ...(data.newsletter ? styles.switchChecked : {}),
          }} aria-hidden="true" />
        </label>

        <label style={styles.toggle}>
          <div style={styles.toggleContent}>
            <span style={styles.toggleLabel}>Push Notifications</span>
            <span style={styles.toggleDescription}>
              Get instant alerts about important updates
            </span>
          </div>
          <input
            type="checkbox"
            id="notifications"
            name="notifications"
            checked={data.notifications}
            onChange={handleToggle('notifications')}
            style={styles.checkbox}
            aria-describedby="notifications-description"
          />
          <span style={{
            ...styles.switch,
            ...(data.notifications ? styles.switchChecked : {}),
          }} aria-hidden="true" />
        </label>
      </div>

      <div style={styles.section} role="group" aria-labelledby="theme-heading">
        <h3 style={styles.sectionTitle} id="theme-heading">Theme</h3>
        <div style={styles.themeOptions} role="radiogroup" aria-labelledby="theme-heading">
          <button
            type="button"
            onClick={handleThemeChange('light')}
            role="radio"
            aria-checked={data.theme === 'light'}
            style={{
              ...styles.themeOption,
              ...(data.theme === 'light' ? styles.themeOptionActive : {}),
            }}
            aria-label="Light theme"
          >
            ☀️ Light
          </button>
          <button
            type="button"
            onClick={handleThemeChange('dark')}
            role="radio"
            aria-checked={data.theme === 'dark'}
            style={{
              ...styles.themeOption,
              ...(data.theme === 'dark' ? styles.themeOptionActive : {}),
            }}
            aria-label="Dark theme"
          >
            🌙 Dark
          </button>
          <button
            type="button"
            onClick={handleThemeChange('system')}
            role="radio"
            aria-checked={data.theme === 'system'}
            style={{
              ...styles.themeOption,
              ...(data.theme === 'system' ? styles.themeOptionActive : {}),
            }}
            aria-label="System theme"
          >
            💻 System
          </button>
        </div>
      </div>

      <div style={styles.actions}>
        <button type="button" onClick={onBack} style={styles.backButton}>
          ← Back
        </button>
        <button type="button" onClick={onNext} style={styles.button}>
          Review →
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
  },
  toggle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#f5f5f5',
    marginBottom: '12px',
    cursor: 'pointer',
    position: 'relative',
  },
  toggleContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  toggleLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  },
  toggleDescription: {
    fontSize: '12px',
    color: '#666',
  },
  checkbox: {
    display: 'none',
  },
  switch: {
    width: '48px',
    height: '24px',
    borderRadius: '12px',
    backgroundColor: '#ccc',
    position: 'relative',
    transition: 'background-color 0.2s',
    flexShrink: 0,
  },
  switchChecked: {
    backgroundColor: '#1976d2',
  },
  themeOptions: {
    display: 'flex',
    gap: '12px',
  },
  themeOption: {
    flex: 1,
    padding: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  themeOptionActive: {
    borderColor: '#1976d2',
    backgroundColor: '#e3f2fd',
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
    backgroundColor: '#1976d2',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
