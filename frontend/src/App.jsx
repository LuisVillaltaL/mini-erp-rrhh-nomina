// frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import MainLayout    from './components/layout/MainLayout';
import LoginPage     from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RRHHPage      from './pages/RRHHPage';
import { NominaPage, ReportesPage, ConfiguracionPage } from './pages/PlaceholderPage';

const PrivateRoute = ({ children }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return null;
  return usuario ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return null;
  return !usuario ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index              element={<DashboardPage />}     />
          <Route path="rrhh"        element={<RRHHPage />}          />
          <Route path="nomina"      element={<NominaPage />}        />
          <Route path="reportes"    element={<ReportesPage />}      />
          <Route path="configuracion" element={<ConfiguracionPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}