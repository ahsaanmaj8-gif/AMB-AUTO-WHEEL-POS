import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Create Context
const AuthContext = createContext();

// Custom Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  
  // ✅ ADD WORKSHOP STATE
  const [workshopId, setWorkshopId] = useState(localStorage.getItem('workshopId') || null);
  const [workshopName, setWorkshopName] = useState(localStorage.getItem('workshopName') || '');

  // Set token in axios headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user from token
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        const response = await axios.get('https://amb-auto-wheel-pos.onrender.com/api/auth/me');
        
        // ✅ Get workshop info from response
        const userData = response.data?.user;
        setUser(userData ? userData : savedUser ? JSON.parse(savedUser) : null);
        
        // ✅ Set workshop data if available
        if (userData?.workshopId) {
          setWorkshopId(userData.workshopId);
          localStorage.setItem('workshopId', userData.workshopId);
          setWorkshopName(userData.workshopName || '');
          localStorage.setItem('workshopName', userData.workshopName || '');
        }
        
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('workshopId');
        localStorage.removeItem('workshopName');
        setUser(null);
        setToken('');
        setWorkshopId(null);
        setWorkshopName('');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const value = {
    user,
    setUser,
    token,
    setToken,
    loading,
    workshopId,        // ✅ ADD
    setWorkshopId,     // ✅ ADD
    workshopName,      // ✅ ADD
    setWorkshopName,   // ✅ ADD
    isAuthenticated: !!user,
    isAdmin: user?.role === 1,
    isStaff: user?.role === 0 || user?.role === 1
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};