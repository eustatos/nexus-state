import React, { useEffect } from 'react';
import { useAtom } from '@nexus-state/react';
import { createStore } from '@nexus-state/core';
import { setupRealTimeUpdates } from './store';
import { DashboardStats, RecentOrders, Notifications } from './components';

// Create store at module level for this example
const dashboardStore = createStore();

function App() {
  const [, setStore] = useAtom('store' as never);

  useEffect(() => {
    // Setup real-time updates simulation
    const cleanup = setupRealTimeUpdates(dashboardStore);
    return cleanup;
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.logo}>📊 Nexus Dashboard</h1>
          <p style={styles.subtitle}>Real-time analytics and insights</p>
        </div>
        <Notifications />
      </header>

      <main style={styles.main}>
        <DashboardStats />
        <RecentOrders />
      </main>

      <footer style={styles.footer}>
        <p>
          Built with @nexus-state/core, @nexus-state/react, @nexus-state/query
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
  },
  headerContent: {
    padding: '24px',
  },
  logo: {
    margin: 0,
    fontSize: '28px',
  },
  subtitle: {
    margin: '8px 0 0 0',
    color: '#666',
    fontSize: '14px',
  },
  main: {
    flex: 1,
    padding: '24px',
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  footer: {
    padding: '16px',
    textAlign: 'center',
    color: '#6c757d',
    fontSize: '14px',
    borderTop: '1px solid #ddd',
  },
};

// Wrap with provider at the entry point
export function AppWithProvider() {
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

export default AppWithProvider;
