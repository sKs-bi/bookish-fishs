import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './stores/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Departments from './pages/Departments';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import AssetLoan from './pages/AssetLoan';
import Purchases from './pages/Purchases';
import Repairs from './pages/Repairs';
import AuditLogs from './pages/AuditLogs';
import SystemConfig from './pages/SystemConfig';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Backups from './pages/Backups';
import AssetTypes from './pages/AssetTypes';
import RoleUpgradeCenter from './pages/RoleUpgradeCenter';
import RoleUpgradeApproval from './pages/RoleUpgradeApproval';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const { isAuthenticated, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUser();
    }
  }, [isAuthenticated, fetchCurrentUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="departments" element={<Departments />} />
          <Route path="assets" element={<Assets />} />
          <Route path="assets/:id" element={<AssetDetail />} />
          <Route path="asset-loans" element={<AssetLoan />} />
          <Route path="asset-types" element={<AssetTypes />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="repairs" element={<Repairs />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="system-config" element={<SystemConfig />} />
          <Route path="backups" element={<Backups />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="role-upgrade" element={<RoleUpgradeCenter />} />
          <Route path="role-upgrade-approval" element={<RoleUpgradeApproval />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
