import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './i18n';
import './styles/index.css';

import App from './App';
import { routes } from './routes';
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<route.element />}
              />
            ))}
          </Route>
        </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  </StrictMode>
);
