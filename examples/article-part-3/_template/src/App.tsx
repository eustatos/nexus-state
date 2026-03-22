import React from 'react';

function App() {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Demo Placeholder</h1>
        <p>Replace this with your demo component</p>
      </header>
      <main style={styles.main}>
        <p>See <code>src/App.tsx</code> for the demo code.</p>
      </main>
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
  },
  main: {
    flex: 1,
    padding: '24px',
  },
};

export default App;
