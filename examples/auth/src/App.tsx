import React from 'react';
import { useAtomValue } from '@nexus-state/react';
import { authStateAtom } from './store';
import { LoginForm, UserProfile } from './components';

function App() {
  const authState = useAtomValue(authStateAtom);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>🔐 Nexus State Auth</h1>
      </header>
      
      <main style={styles.main}>
        {!authState.isAuthenticated ? (
          <LoginForm />
        ) : (
          <UserProfile />
        )}
      </main>

      <footer style={styles.footer}>
        <p>Built with @nexus-state/core, @nexus-state/react, @nexus-state/query, @nexus-state/persist</p>
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
    padding: '20px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #ddd',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  logo: {
    margin: 0,
    fontSize: '24px',
  },
  main: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
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
