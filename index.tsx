
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initStorage } from './utils/storage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const InitWrapper = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initStorage().then(() => setIsReady(true));
  }, []);

  if (!isReady) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>Loading workspace data...</div>;
  }

  return <App />;
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <InitWrapper />
  </React.StrictMode>
);

