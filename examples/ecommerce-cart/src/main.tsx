import React from 'react';
import ReactDOM from 'react-dom/client';
import { StoreProvider } from '@nexus-state/react';
import { createStore } from '@nexus-state/core';
import { applyCartPersist } from './store';
import App from './App';

const store = createStore();

// Apply persist plugin to restore cart from localStorage
applyCartPersist(store);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider store={store}>
      <App />
    </StoreProvider>
  </React.StrictMode>
);
