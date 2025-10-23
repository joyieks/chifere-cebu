import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BuyerLayout from '../../Buyer_Layout/Buyer_layout';
import { useAuth } from '../../../../../../contexts/AuthContext';
import theme from '../../../../../../styles/designSystem';

const UserPageLayout = ({ children }) => {
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Close My Account submenu when not on /buyer/account or its subpages
  React.useEffect(() => {
    if (!location.pathname.startsWith('/buyer/account')) {
      setShowAccountMenu(false);
    }
  }, [location.pathname]);

  // Helper to check if a route is active
  const isActive = (path) => location.pathname === path;

  // Default user data fallback
  const displayName = user?.displayName || user?.name || 'User';
  const userAvatar = user?.avatar || user?.profileImage || '/default-avatar.png';

  return (
    <BuyerLayout>
      <div className="flex flex-1 w-full min-h-screen">
        {/* Sidebar */}
        <aside 
          className="bg-white shadow-lg p-6 flex flex-col"
          style={{ 
            width: theme.layout.sidebar.wide,
            backgroundColor: theme.colors.white,
            boxShadow: theme.shadows.lg
          }}
        >
          {/* Profile Section */}
          <div className="flex flex-col items-center mb-8">
            <img 
              src={userAvatar} 
              alt={displayName} 
              className="w-20 h-20 rounded-full object-cover mb-2"
              style={{ 
                border: `4px solid ${theme.colors.primary[800]}`,
                borderRadius: theme.borderRadius.full
              }}
              onError={(e) => {
                e.target.src = '/default-avatar.png';
              }}
            />
            <span 
              className="font-bold text-lg"
              style={{ 
                color: theme.colors.primary[900],
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold
              }}
            >
              {displayName}
            </span>
          </div>
          {/* Navigation */}
          <nav className="flex flex-col" style={{ gap: theme.spacing[2] }}>
            <button
              className="flex items-center justify-between px-4 py-2 rounded focus:outline-none font-semibold transition-colors"
              style={{
                backgroundColor: isActive('/buyer/account') ? theme.colors.primary[100] : 'transparent',
                color: isActive('/buyer/account') ? theme.colors.primary[800] : theme.colors.gray[800],
                borderRadius: theme.borderRadius.lg,
                padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                transition: theme.animations.transition.colors,
              }}
              onMouseEnter={(e) => {
                if (!isActive('/buyer/account')) {
                  e.target.style.backgroundColor = theme.colors.primary[50];
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/buyer/account')) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
              onClick={() => {
                setShowAccountMenu((prev) => !prev);
                if (!location.pathname.startsWith('/buyer/account')) {
                  navigate('/buyer/account');
                }
              }}
            >
              <span>My Account</span>
              <svg className={`w-4 h-4 ml-2 transition-transform ${showAccountMenu ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            {showAccountMenu && location.pathname.startsWith('/buyer/account') && (
              <div className="ml-8 flex flex-col gap-1 mb-2">
                <button
                  className={`text-left px-2 py-1 rounded ${isActive('/buyer/account') ? 'bg-blue-200 text-blue-900' : 'hover:bg-blue-100 text-gray-700'}`}
                  onClick={() => navigate('/buyer/account')}
                  disabled={isActive('/buyer/account')}
                >
                  Profile
                </button>
                <button
                  className={`text-left px-2 py-1 rounded ${isActive('/buyer/account/bank-cards') ? 'bg-blue-200 text-blue-900' : 'hover:bg-blue-100 text-gray-700'}`}
                  onClick={() => navigate('/buyer/account/bank-cards')}
                  disabled={isActive('/buyer/account/bank-cards')}
                >
                  E-Wallet
                </button>
                <button
                  className={`text-left px-2 py-1 rounded ${isActive('/buyer/account/address') ? 'bg-blue-200 text-blue-900' : 'hover:bg-blue-100 text-gray-700'}`}
                  onClick={() => navigate('/buyer/account/address')}
                  disabled={isActive('/buyer/account/address')}
                >
                  Address
                </button>
                <button
                  className={`text-left px-2 py-1 rounded ${isActive('/buyer/account/change-password') ? 'bg-blue-200 text-blue-900' : 'hover:bg-blue-100 text-gray-700'}`}
                  onClick={() => navigate('/buyer/account/change-password')}
                  disabled={isActive('/buyer/account/change-password')}
                >
                  Change Password
                </button>
              </div>
            )}
            <button
              className={`text-left px-4 py-2 rounded font-semibold focus:outline-none ${isActive('/buyer/purchase') ? 'bg-blue-100 text-blue-800' : 'hover:bg-blue-50 text-gray-800'}`}
              onClick={() => navigate('/buyer/purchase')}
            >My Purchased</button>
            <button
              className={`text-left px-4 py-2 rounded font-semibold focus:outline-none ${isActive('/buyer/notifications') ? 'bg-blue-100 text-blue-800' : 'hover:bg-blue-50 text-gray-800'}`}
              onClick={() => navigate('/buyer/notifications')}
            >Notifications</button>
            <button
              className={`text-left px-4 py-2 rounded font-semibold focus:outline-none ${isActive('/buyer/settings') ? 'bg-blue-100 text-blue-800' : 'hover:bg-blue-50 text-gray-800'}`}
              onClick={() => navigate('/buyer/settings')}
            >Settings</button>
          </nav>
        </aside>
        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </BuyerLayout>
  );
};

export default UserPageLayout;
