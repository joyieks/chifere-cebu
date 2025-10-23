import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAuth = true, requireRole = null, redirectTo = null }) => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  console.log('🔒🔒🔒 [ProtectedRoute] ===== START CHECK =====');
  console.log('🔒 [ProtectedRoute] Path:', location.pathname);
  console.log('🔒 [ProtectedRoute] requireAuth:', requireAuth);
  console.log('🔒 [ProtectedRoute] requireRole:', requireRole);
  console.log('🔒 [ProtectedRoute] redirectTo:', redirectTo);
  console.log('🔒 [ProtectedRoute] loading:', loading);
  console.log('🔒 [ProtectedRoute] user:', user);
  if (user) {
    console.log('🔒 [ProtectedRoute] user.id:', user.id);
    console.log('🔒 [ProtectedRoute] user.role:', user.role);
    console.log('🔒 [ProtectedRoute] user.user_type:', user.user_type);
  }
  console.log('🔒🔒🔒 [ProtectedRoute] ===== END CHECK =====');

  if (loading) {
    console.log('⏳ [ProtectedRoute] Still loading, showing spinner...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requireAuth && !user && !loading) {
    console.log('❌ [ProtectedRoute] No user after loading, redirecting to login');
    // Redirect to login if not authenticated (only after loading is complete)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show loading while checking authentication
  if (requireAuth && !user && loading) {
    console.log('⏳ [ProtectedRoute] Still loading auth, showing spinner...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!requireAuth && user) {
    // Redirect to appropriate dashboard based on user role
    let dashboardPath = '/buyer/dashboard';
    if (user.role === 'admin') dashboardPath = '/admin/dashboard';
    else if (user.role === 'seller') dashboardPath = '/seller/dashboard';
    
    console.log('🚫 [ProtectedRoute] User exists but route requires no auth, redirecting to:', dashboardPath);
    return <Navigate to={dashboardPath} replace />;
  }

  // Check role-based access
  if (requireRole && user && user.role !== requireRole) {
    // Redirect to the specified path or to the appropriate dashboard
    let defaultDashboard = '/buyer/dashboard';
    if (user.role === 'admin') defaultDashboard = '/admin/dashboard';
    else if (user.role === 'seller') defaultDashboard = '/seller/dashboard';
    
    const redirectPath = redirectTo || defaultDashboard;
    console.log('🚫 [ProtectedRoute] Role mismatch. Required:', requireRole, 'User role:', user.role, 'Redirecting to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  // Check if seller is pending approval
  if (requireRole === 'seller' && user && user.role === 'seller' && user.seller_status === 'pending') {
    console.log('⏳ [ProtectedRoute] Seller account pending approval - user:', user.email, 'seller_status:', user.seller_status);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Pending Review</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-left">
            <p className="text-sm text-yellow-700">
              Your seller account is currently being reviewed by our admin team. You will receive an email notification once your account has been approved.
            </p>
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-center text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Account Created</span>
            </div>
            <div className="flex items-center justify-center text-sm text-gray-600">
              <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Pending Admin Approval</span>
            </div>
          </div>
          <button
            onClick={async () => {
              console.log('🔄 [ProtectedRoute] Logging out and navigating to login');
              try {
                await logout();
                navigate('/login');
              } catch (error) {
                console.error('❌ [ProtectedRoute] Logout error:', error);
                navigate('/login');
              }
            }}
            className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  console.log('✅ [ProtectedRoute] Access granted for:', location.pathname, 'user:', user?.email, 'role:', user?.role, 'seller_status:', user?.seller_status);
  return children;
};

export default ProtectedRoute; 