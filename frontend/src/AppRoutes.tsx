import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Sales from './pages/Sales';
import Stocks from './pages/Stocks';
import Payments from './pages/Payments';
import Ledger from './pages/Ledger';
import LedgerAccount from './pages/LedgerAccount';
import Accounts from './pages/Accounts';
import SalesmanDashboard from './pages/SalesmanDashboard';
import PaymentReceipt from './pages/PaymentReciepts';
import Invoice from './pages/Invoice';
import { useAuth } from './contexts/AuthContext';

// Protected Route Components
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { isAuthenticated, user } = useAuth();

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route 
          path="/login" 
          element={
            isAuthenticated && user ? (
              <Navigate to={user.role === 'admin' ? '/dashboard' : '/salesman-dashboard'} replace />
            ) : (
              <Login />
            )
          } 
        />
        
        {/* Salesman Dashboard Route */}
        <Route
          path="/salesman-dashboard"
          element={
            <ProtectedRoute allowedRoles={['salesperson']}>
              <SalesmanDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/sales"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <Sales />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/stocks"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <Stocks />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/payments"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <Payments />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/ledger"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <Ledger />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/ledger-account/:ledgerId"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <LedgerAccount />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/accounts"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <Accounts />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Payment Receipt Route - Standalone */}
        <Route
          path="/payment-receipt"
          element={<PaymentReceipt />}
        />

        {/* Invoice Route - Standalone */}
        <Route
          path="/invoice"
          element={<Invoice />}
        />

        {/* Default Route */}
        <Route 
          path="/" 
          element={
            isAuthenticated && user ? (
              <Navigate to={user.role === 'admin' ? '/dashboard' : '/salesman-dashboard'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Catch all route */}
        <Route 
          path="*" 
          element={
            <Navigate to={isAuthenticated && user ? (user.role === 'admin' ? '/dashboard' : '/salesman-dashboard') : '/login'} replace />
          } 
        />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
