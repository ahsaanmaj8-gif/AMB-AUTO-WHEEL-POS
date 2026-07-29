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

// const [user, setUser] = useState(() => {
//   const savedUser = localStorage.getItem('user');
//   return savedUser ? JSON.parse(savedUser) : null;
// });
// console.log(localStorage.getItem("user"));

  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

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
        // console.log("User data fetched auth me api:", response.data);
        // console.log("JSON.parse(savedUser) local storage:", JSON.parse(savedUser));
        setUser(response.data?.user ? response.data.user : savedUser ? JSON.parse(savedUser) : null);
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('token');
        setToken('');
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