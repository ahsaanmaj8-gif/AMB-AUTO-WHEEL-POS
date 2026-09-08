import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    FaDollarSign,
    FaTachometerAlt,
    FaBox,
    FaWrench,
    FaTags,
    FaHistory,
    FaUser,
    FaSignOutAlt,
    FaFileInvoice,
    FaMoneyBillWave,
    FaCog   
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useEffect } from 'react';
import { useState } from 'react';

const Sidebar = () => {
    const { user, setUser, setToken } = useAuth();
    const [settings, setSettings] = useState({});
    const navigate = useNavigate();

    const menuItems = [
        { path: '/dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
        { path: '/products', icon: FaBox, label: 'Products' },
        { path: '/services', icon: FaWrench, label: 'Services' },
        { path: '/invoices', icon: FaFileInvoice, label: 'Invoices' },
        { path: '/revenue', icon: FaDollarSign, label: 'Revenue' },
        { path: '/expenses', icon: FaMoneyBillWave, label: 'Expenses' },
        { path: '/categories', icon: FaTags, label: 'Categories' },
        { path: '/transactions', icon: FaHistory, label: 'Transactions' },
        { path: '/profile', icon: FaUser, label: 'Profile' },
         ...(user.workshopName !== "AMB Auto Wheel"
    ? [{ path: '/settings', icon: FaCog, label: 'Settings' }]
    : []),
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('workshopId');      // ✅ ADD
        localStorage.removeItem('workshopName');    // ✅ ADD

        setToken('');
        setUser(null);
        toast.success('Logged out successfully');
        navigate('/login');
    };



     const fetchSettings = async () => {
  try {
    const response = await axios.get('https://amb-auto-wheel-pos.onrender.com/api/settings');

    // console.log('Fetched settings:', response.data);

    setSettings(response.data.settings || {});
  } catch (error) {
    console.error('Failed to fetch settings:', error);
  }
};

useEffect(() => {
  fetchSettings();
}, []);


    return (
        <div className="w-64 bg-white shadow-lg flex flex-col h-full fixed left-0 top-0 bottom-0 z-30">
            {/* Logo Section */}
            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
                <h1 className="text-2xl gap-1 flex flex-col font-bold text-white items-center">
                    <img
  src={
    user?.workshopName?.trim().toLowerCase() === "amb auto wheel"
      ? "/amblogoblack.jpg"
      : settings?.logo || "/workshop_general_logo.jpg"
  }
  alt="Auto Workshop Software"
  className="w-14 h-14 object-contain rounded-full bg-white p-1"
/>

                    {/* <p>AMB Auto Wheel</p> */}
                    {user?.workshopName && (
                    <p className="">
                        {user.workshopName}
                    </p>
                )}
                </h1>
                <p className="text-blue-100 text-xs mt-2 text-center">
                    Performance Meets Perfection
                </p>
                {/* ✅ ADD WORKSHOP NAME */}
                {/* {user?.workshopName && (
                    <p className="text-blue-200 text-xs mt-2 text-center border-t border-blue-500 pt-2">
                        🏪 {user.workshopName}
                    </p>
                )} */}
            </div>

            {/* User Info */}
            <div className="px-4 py-3 border-b bg-gray-50">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">
                    {user?.role === 1 ? 'Administrator' : 'Staff'}
                </p>
                {/* ✅ ADD WORKSHOP NAME HERE TOO */}
                {/* {user?.workshopName && (
                    <p className="text-xs text-blue-600 font-medium mt-1">
                        🏪 {user.workshopName}
                    </p>
                )} */}
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <item.icon className="text-lg" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t">
                <button
                    onClick={handleLogout}
                    className="sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                    <FaSignOutAlt className="text-lg" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;