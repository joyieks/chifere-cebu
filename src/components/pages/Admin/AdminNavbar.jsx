import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShield, FiLogOut, FiClock, FiUsers, FiBarChart2 } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../Toast';

const AdminNavbar = ({ currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully', 'success');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Logout failed. Please try again.', 'error');
    }
  };

  const navItems = [
    { id: 'pending', label: 'Pending', icon: FiClock, color: 'yellow' },
    { id: 'users', label: 'Users', icon: FiUsers, color: 'blue' },
    { id: 'reports', label: 'Reports', icon: FiBarChart2, color: 'green' }
  ];

  const getItemClasses = (item) => {
    const baseClasses = "flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors";
    const isActive = currentPage === item.id;
    
    if (isActive) {
      return `${baseClasses} bg-${item.color}-50 text-${item.color}-700 border border-${item.color}-200`;
    }
    
    return `${baseClasses} text-gray-600 hover:text-gray-900 hover:bg-gray-50`;
  };

  const getIconClasses = (item) => {
    const isActive = currentPage === item.id;
    return `w-5 h-5 ${isActive ? `text-${item.color}-600` : 'text-gray-400'}`;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <FiShield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Portal</h1>
                <p className="text-sm text-gray-500">ChiFere Management</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={getItemClasses(item)}
                >
                  <Icon className={getIconClasses(item)} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Info and Logout */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name || user?.email}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <FiShield className="w-4 h-4 text-gray-600" />
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiLogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 py-3">
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === item.id
                      ? `bg-${item.color}-50 text-${item.color}-700 border border-${item.color}-200`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${currentPage === item.id ? `text-${item.color}-600` : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
