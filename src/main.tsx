import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Landing } from './Landing';

const isAppRoute = window.location.pathname.replace(/\/+$/, '') === '/app';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isAppRoute ? <App /> : <Landing />}</React.StrictMode>
);
