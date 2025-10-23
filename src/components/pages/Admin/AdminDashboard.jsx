import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import AdminNavbar from './AdminNavbar';
import PendingPage from './PendingPage';
import UsersPage from './UsersPage';
import ReportsPage from './ReportsPage';

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Get current page from URL or localStorage, default to 'pending'
  const getInitialPage = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageFromUrl = urlParams.get('page');
    const pageFromStorage = localStorage.getItem('admin_current_page');
    return pageFromUrl || pageFromStorage || 'pending';
  };
  
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  
  // Save current page to localStorage when it changes
  const handlePageChange = (page) => {
    setCurrentPage(page);
    localStorage.setItem('admin_current_page', page);
  };

  // Show loading spinner while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if user is admin
  const isAdmin = user && (user.role === 'admin' || user.user_type === 'admin');
    
  // Only redirect if we're sure there's no user and we're not loading
  if (!loading && !user) {
    console.log('❌ [AdminDashboard] No user found after loading, redirecting to login');
    navigate('/login');
    return null;
  }
    
  if (!loading && user && !isAdmin) {
    console.log('❌ [AdminDashboard] User is not admin, redirecting to appropriate dashboard');
    const redirectPath = user.role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard';
    navigate(redirectPath);
    return null;
  }

  // If still loading or no user yet, show loading
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Restoring admin session...</p>
        </div>
      </div>
    );
  }

  console.log('✅ [AdminDashboard] Admin user confirmed, rendering dashboard');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'pending':
        return <PendingPage />;
      case 'users':
        return <UsersPage />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <PendingPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <AdminNavbar currentPage={currentPage} onPageChange={handlePageChange} />
      {renderCurrentPage()}
    </div>
  );
};


export default AdminDashboard;
