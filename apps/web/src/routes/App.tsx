import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../state/auth.js';
import { LoginPage } from './LoginPage.js';
import { RegisterPage } from './RegisterPage.js';
import { Dashboard } from './Dashboard.js';

function Protected({ children }: { children: JSX.Element }): JSX.Element {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function App(): JSX.Element {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </AuthProvider>
  );
}
