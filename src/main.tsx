import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';

const App = lazy(() => import('./App'));
const Landing = lazy(() => import('./Landing').then((m) => ({ default: m.Landing })));
const HowItListens = lazy(() =>
  import('./pages/HowItListens').then((m) => ({ default: m.HowItListens }))
);
const Boundaries = lazy(() => import('./pages/Boundaries').then((m) => ({ default: m.Boundaries })));
const Privacy = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.Privacy })));
const Story = lazy(() => import('./pages/Story').then((m) => ({ default: m.Story })));

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
  <React.StrictMode>
    <Suspense fallback={null}>{renderRoute ? renderRoute() : <Landing />}</Suspense>
  </React.StrictMode>
);
