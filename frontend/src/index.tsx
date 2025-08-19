import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n';
import './utils/errorHandler'; // Global error handling setup
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);