import React from 'react';
import './App.css';
import AppRoutes from './routes';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:text-blue-700 focus:px-3 focus:py-2 focus:rounded"
      >
        Skip to main content
      </a>
      <AppRoutes />
    </div>
  );
}

export default App;
