import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ValidarDeclaracao from './ValidarDeclaracao.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* /validar: página pública que confere o código das declarações (Jorge, 03/11/2026) — fora do App */}
    {window.location.pathname.replace(/\/+$/, '').toLowerCase() === '/validar' ? <ValidarDeclaracao /> : <App />}
  </StrictMode>,
);
