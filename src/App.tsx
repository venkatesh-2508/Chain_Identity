import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedLayout } from './components/common/Layout';

// Public pages
import { HomePage } from './pages/public/HomePage';
import { LoginPage } from './pages/public/LoginPage';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { AssetManagement } from './pages/admin/AssetManagement';
import { AllocationsView } from './pages/admin/AllocationsView';
import { SystemAudit } from './pages/admin/SystemAudit';

// Security Manager pages
import { SecurityDashboard } from './pages/security/SecurityDashboard';
import { AccessRequestsReview } from './pages/security/AccessRequestsReview';
import { PermissionsManager } from './pages/security/PermissionsManager';
import { SecurityAlertsView } from './pages/security/SecurityAlertsView';
import { InvestigationCenter } from './pages/security/InvestigationCenter';

// Employee pages
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { EmployeeAllocatedAssets } from './pages/employee/EmployeeAllocatedAssets';
import { EmployeeAccessRequests } from './pages/employee/EmployeeAccessRequests';
import { EmployeeAccessHistory } from './pages/employee/EmployeeAccessHistory';

// Auditor pages
import { AuditorDashboard } from './pages/auditor/AuditorDashboard';
import { IntegrityVerifier } from './pages/auditor/IntegrityVerifier';
import { AssetLifecycleTrails } from './pages/auditor/AssetLifecycleTrails';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route element={<ProtectedLayout allowedRoles={['ADMINISTRATOR']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/assets" element={<AssetManagement />} />
            <Route path="/admin/allocations" element={<AllocationsView />} />
            <Route path="/admin/audit" element={<SystemAudit />} />
          </Route>

          {/* Security Manager Routes */}
          <Route element={<ProtectedLayout allowedRoles={['SECURITY_MANAGER', 'ADMINISTRATOR']} />}>
            <Route path="/security" element={<SecurityDashboard />} />
            <Route path="/security/requests" element={<AccessRequestsReview />} />
            <Route path="/security/permissions" element={<PermissionsManager />} />
            <Route path="/security/alerts" element={<SecurityAlertsView />} />
            <Route path="/security/investigations" element={<InvestigationCenter />} />
          </Route>

          {/* Employee Routes */}
          <Route element={<ProtectedLayout allowedRoles={['EMPLOYEE', 'ADMINISTRATOR']} />}>
            <Route path="/employee" element={<EmployeeDashboard />} />
            <Route path="/employee/assets" element={<EmployeeAllocatedAssets />} />
            <Route path="/employee/access-requests" element={<EmployeeAccessRequests />} />
            <Route path="/employee/history" element={<EmployeeAccessHistory />} />
            <Route path="/employee/profile" element={<EmployeeDashboard />} />
          </Route>

          {/* Auditor Routes */}
          <Route element={<ProtectedLayout allowedRoles={['AUDITOR', 'ADMINISTRATOR']} />}>
            <Route path="/auditor" element={<AuditorDashboard />} />
            <Route path="/auditor/audit" element={<AuditorDashboard />} />
            <Route path="/auditor/verification" element={<IntegrityVerifier />} />
            <Route path="/auditor/assets" element={<AssetLifecycleTrails />} />
            <Route path="/auditor/users" element={<AuditorDashboard />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
