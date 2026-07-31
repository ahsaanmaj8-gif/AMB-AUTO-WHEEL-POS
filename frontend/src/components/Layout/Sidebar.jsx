import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    FaTachometerAlt,
    FaBox,
    FaWrench,
    FaTags,
    FaHistory,
    FaUser,
    FaSignOutAlt,
    FaFileInvoice
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Sidebar = () => {
    const { user, setUser, setToken } = useAuth();
    const navigate = useNavigate();

    const menuItems = [
        { path: '/dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
        { path: '/products', icon: FaBox, label: 'Products' },
        { path: '/services', icon: FaWrench, label: 'Services' },
        { path: '/invoices', icon: FaFileInvoice, label: 'Invoices' },
        { path: '/categories', icon: FaTags, label: 'Categories' },
        { path: '/transactions', icon: FaHistory, label: 'Transactions' },
        { path: '/profile', icon: FaUser, label: 'Profile' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setToken('');
        setUser(null);
        toast.success('Logged out successfully');
        navigate('/login');
    };

    return (
        <div className="w-64 bg-white shadow-lg flex flex-col h-full fixed left-0 top-0 bottom-0 z-30">
            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
  <h1 className="text-2xl font-bold text-white items-center gap-3">
    <img
      src="/amblogoblack.jpg"
      alt="AMB Logo"
      className="w-14 h-14 object-contain rounded-full bg-white p-1"
    />
    <br/>
    <span>AMB Auto Wheel</span>
  </h1>

  <p className="text-blue-100 text-xs mt-2">
    Performance Meets Perfection
  </p>
</div>

            <div className="px-4 py-3 border-b bg-gray-50">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">
                    {user?.role === 1 ? 'Administrator' : 'Staff'}
                </p>
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