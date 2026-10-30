import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/600.css';

import { App } from './App';
import './i18n';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing from index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
