import React from 'react';
import ReactDOM from 'react-dom/client';
import { StoreProvider } from '@nexus-state/react';
import { createStore } from '@nexus-state/core';
import App from './App';

const store = createStore();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider store={store}>
      <App />
    </StoreProvider>
  </React.StrictMode>
);
