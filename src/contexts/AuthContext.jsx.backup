import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on app start
    const savedUser = localStorage.getItem('chifere_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('chifere_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role = 'buyer') => {
    try {
      // Simulate API call - replace with actual authentication
      // For testing: allow specific credentials with role selection
      if (email === 'test@gmail.com' && password === '123456') {
        const mockUser = {
          id: 1,
          email,
          name: role === 'seller' ? 'John Seller' : 'John Buyer',
          role: role,
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          canSwitchRoles: true // Allow cross-role actions for barter marketplace
        };
        
        setUser(mockUser);
        localStorage.setItem('chifere_user', JSON.stringify(mockUser));
        return { success: true };
      } else {
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (email, password, name, role = 'buyer') => {
    try {
      // Simulate API call - replace with actual registration
      const mockUser = {
        id: Date.now(), // Generate unique ID
        email,
        name,
        role: role,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        canSwitchRoles: true // Allow cross-role actions for barter marketplace
      };
      
      setUser(mockUser);
      localStorage.setItem('chifere_user', JSON.stringify(mockUser));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const switchRole = (newRole) => {
    if (user && user.canSwitchRoles) {
      const updatedUser = {
        ...user,
        role: newRole,
        name: newRole === 'seller' ? user.name.replace('Buyer', 'Seller') : user.name.replace('Seller', 'Buyer')
      };
      setUser(updatedUser);
      localStorage.setItem('chifere_user', JSON.stringify(updatedUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('chifere_user');
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    switchRole,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 