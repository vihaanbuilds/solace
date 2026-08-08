import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Landing } from './Landing';
import { HowItListens } from './pages/HowItListens';
import { Boundaries } from './pages/Boundaries';
import { Privacy } from './pages/Privacy';
import { Story } from './pages/Story';

const ROUTES: Record<string, () => React.ReactElement> = {
  '/app': () => <App />,
  '/how-it-works': () => <HowItListens />,
  '/boundaries': () => <Boundaries />,
  '/privacy': () => <Privacy />,
  '/story': () => <Story />,
};

const path = window.location.pathname.replace(/\/+$/, '') || '/';
const renderRoute = ROUTES[path];

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{renderRoute ? renderRoute() : <Landing />}</React.StrictMode>
);
