import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { HomePage } from '../../features/home/pages/HomePage.jsx';
import { ScanPage } from '../../features/diagnosis/pages/ScanPage.jsx';
import { ResultPage } from '../../features/diagnosis/pages/ResultPage.jsx';
import { LoginPage } from '../../features/auth/pages/LoginPage.jsx';
import { DiagnosesPage } from '../../features/history/pages/DiagnosesPage.jsx';
import { DiagnosisDetailPage } from '../../features/history/pages/DiagnosisDetailPage.jsx';
import { CatalogPage } from '../../features/catalog/pages/CatalogPage.jsx';
import { ConditionDetailPage } from '../../features/catalog/pages/ConditionDetailPage.jsx';
import { AccountPage } from '../../features/account/pages/AccountPage.jsx';
import { NotFoundPage } from '../../features/system/pages/NotFoundPage.jsx';
import { UIShowcasePage } from '../pages/UIShowcasePage.jsx';
import { ENV } from '../../shared/config/env.js';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'escanear', element: <ScanPage /> },
      { path: 'resultado', element: <ResultPage /> },
      { path: 'ingresar', element: <LoginPage /> },
      { path: 'catalogo', element: <CatalogPage /> },
      { path: 'catalogo/:classKey', element: <ConditionDetailPage /> },
      {
        path: 'diagnosticos',
        element: (
          <ProtectedRoute>
            <DiagnosesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'diagnosticos/:id',
        element: (
          <ProtectedRoute>
            <DiagnosisDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'cuenta',
        element: (
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        ),
      },
      // Página de catálogo de componentes (solo en desarrollo)
      ...(ENV.IS_DEV ? [{ path: '_ui', element: <UIShowcasePage /> }] : []),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
