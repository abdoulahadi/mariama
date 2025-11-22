// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Common/Toast';
import ErrorBoundary from './components/Common/ErrorBoundary';
import Navbar from './components/Navbar';
import Sidebar from './components/Layout/Sidebar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import Users from './pages/Users';

// Layout avec sidebar
const AppLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '250px', width: 'calc(100% - 250px)', minHeight: 'calc(100vh - 60px)' }}>
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Navbar />
            <AppLayout>
              <Routes>
                <Route path="/login" element={<Login />} />

                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/resources"
                  element={
                    <PrivateRoute>
                      <Resources />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/users"
                  element={
                    <PrivateRoute requiredRoles={['SECURITY_MANAGER', 'DEPARTMENT_HEAD']}>
                      <Users />
                    </PrivateRoute>
                  }
                />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </AppLayout>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
