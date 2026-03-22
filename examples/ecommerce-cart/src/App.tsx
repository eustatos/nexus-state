import React, { useState } from 'react';
import { useAtomValue } from '@nexus-state/react';
import { cartItemCountAtom } from './store';
import { ProductList, Cart } from './components';

type Tab = 'products' | 'cart';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const itemCount = useAtomValue(cartItemCountAtom);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>🛒 Nexus Cart</h1>
        <nav style={styles.nav}>
          <button
            onClick={() => setActiveTab('products')}
            style={activeTab === 'products' ? styles.activeTab : styles.tab}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            style={activeTab === 'cart' ? styles.activeTab : styles.tab}
          >
            Cart
            {itemCount > 0 && <span style={styles.badge}>{itemCount}</span>}
          </button>
        </nav>
      </header>

      <main style={styles.main}>
        {activeTab === 'products' ? <ProductList /> : <Cart />}
      </main>

      <footer style={styles.footer}>
        <p>
          Built with @nexus-state/core, @nexus-state/react, @nexus-state/persist
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #ddd',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  logo: {
    margin: 0,
    fontSize: '24px',
  },
  nav: {
    display: 'flex',
    gap: '8px',
  },
  tab: {
    padding: '10px 20px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    position: 'relative',
  },
  activeTab: {
    padding: '10px 20px',
    border: '1px solid #1976d2',
    borderRadius: '4px',
    backgroundColor: '#1976d2',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    backgroundColor: '#dc3545',
    color: '#fff',
    borderRadius: '50%',
    minWidth: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
  },
  main: {
    flex: 1,
    padding: '24px',
    maxWidth: '1200px',
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
