import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaBell, FaSearch, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Header = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const [searching, setSearching] = useState(false);
    const searchRef = useRef(null);

    // ============ NOTIFICATION STATE ============
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('notifications');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [unreadCount, setUnreadCount] = useState(() => {
        const saved = localStorage.getItem('unreadCount');
        return saved ? parseInt(saved) : 0;
    });
    
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef(null);

    // ============ FETCH NOTIFICATIONS (ONLY UNREAD) ============
    const fetchNotifications = async () => {
        try {
            const response = await axios.get('https://amb-auto-wheel-pos.onrender.com/api/notifications');
            const notifs = response.data.notifications || [];
            const count = response.data.unreadCount || 0;
            
            setNotifications(notifs);
            setUnreadCount(count);
            
            localStorage.setItem('notifications', JSON.stringify(notifs));
            localStorage.setItem('unreadCount', String(count));
        } catch (error) {
            console.error('Error fetching notifications:', error);
            const saved = localStorage.getItem('notifications');
            if (saved) {
                setNotifications(JSON.parse(saved));
            }
        }
    };

    // ============ DELETE NOTIFICATION (Instead of Mark as Read) ============
    const deleteNotification = async (id) => {
        try {
            // ✅ DELETE from database
            await axios.delete(`https://amb-auto-wheel-pos.onrender.com/api/notifications/${id}`);
            
            // ✅ Remove from local state
            const updated = notifications.filter(n => n._id !== id);
            setNotifications(updated);
            setUnreadCount(updated.length);
            
            // ✅ Update localStorage
            localStorage.setItem('notifications', JSON.stringify(updated));
            localStorage.setItem('unreadCount', String(updated.length));
            
            toast.success('Notification removed');
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Failed to remove notification');
        }
    };

    // ============ DELETE ALL NOTIFICATIONS ============
    const deleteAllNotifications = async () => {
        if (notifications.length === 0) {
            toast.info('No notifications to clear');
            return;
        }

        try {
            // ✅ DELETE ALL from database
            await axios.delete('https://amb-auto-wheel-pos.onrender.com/api/notifications');
            
            // ✅ Clear local state
            setNotifications([]);
            setUnreadCount(0);
            
            // ✅ Clear localStorage
            localStorage.setItem('notifications', JSON.stringify([]));
            localStorage.setItem('unreadCount', '0');
            
            toast.success('All notifications cleared');
        } catch (error) {
            console.error('Error deleting all:', error);
            toast.error('Failed to clear notifications');
        }
    };

    // ============ LOAD NOTIFICATIONS ON MOUNT ============
    useEffect(() => {
        fetchNotifications();
        
        // Refresh every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // ============ UPDATE LOCALSTORAGE WHEN STATE CHANGES ============
    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
        localStorage.setItem('unreadCount', String(unreadCount));
    }, [notifications, unreadCount]);

    // ============ CLOSE ON OUTSIDE CLICK ============
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearch(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ============ SEARCH ============
    useEffect(() => {
        const delay = setTimeout(() => {
            if (searchTerm.trim().length > 0) {
                fetchSearch(searchTerm);
            } else {
                setSearchResults([]);
                setShowSearch(false);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    const fetchSearch = async (query) => {
        setSearching(true);
        try {
            const response = await axios.get(`https://amb-auto-wheel-pos.onrender.com/api/products?search=${query}`);
            setSearchResults(response.data.products || []);
            setShowSearch(true);
        } catch (error) {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        navigate(`/products?search=${searchTerm}`);
        setShowSearch(false);
    };

    const clearSearch = () => {
        setSearchTerm('');
        setSearchResults([]);
        setShowSearch(false);
    };

    const goToProduct = (product) => {
        navigate(`/products?search=${product.name}`);
        clearSearch();
    };

    // ============ HANDLE NOTIFICATION CLICK ============
    const handleNotifClick = (notification) => {
        // ✅ DELETE instead of mark as read
        deleteNotification(notification._id);
        setShowNotifications(false);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    // ============ GET TIME AGO ============
    const getTimeAgo = (date) => {
        const diff = Math.floor((new Date() - new Date(date)) / 60000);
        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return `${Math.floor(diff / 1440)}d ago`;
    };

    // ============ GET ICON ============
    const getIcon = (type) => {
        const icons = {
            'low-stock': '⚠️',
            'service': '🔧',
            'invoice': '📄',
            'general': '📢'
        };
        return icons[type] || '📢';
    };

    // ============ HIGHLIGHT MATCH FUNCTION ============
    const highlightMatch = (text, query) => {
        if (!query || !text) return text;
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
        return parts.map((part, index) => 
            part.toLowerCase() === query.toLowerCase() ? 
                <span key={index} className="bg-yellow-300 font-semibold px-0.5">{part}</span> : 
                part
        );
    };

    return (
        <header className="bg-white shadow-sm px-6 py-4 sticky top-0 z-20">
            <div className="flex justify-between items-center">
                {/* Left */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        Welcome back, <span className="text-blue-600">{user?.name}</span>!
                    </h2>
                    <p className="text-sm text-gray-500">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>

                {/* Right */}
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative hidden md:block" ref={searchRef}>
                        <form onSubmit={handleSearch} className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all duration-200 min-w-[250px]">
                            <FaSearch className="text-gray-400 text-sm" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search products..."
                                className="bg-transparent border-none focus:outline-none text-sm w-full ml-2"
                                onFocus={() => searchResults.length > 0 && setShowSearch(true)}
                            />
                            {searchTerm && (
                                <button type="button" onClick={clearSearch} className="text-gray-400 hover:text-gray-600">
                                    <FaTimes className="text-xs" />
                                </button>
                            )}
                            {searching && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-1"></div>}
                        </form>

                        {showSearch && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border max-h-80 overflow-y-auto z-50">
                                <div className="p-2 border-b bg-gray-50 sticky top-0 flex justify-between items-center">
                                    <span className="text-xs text-gray-500">{searchResults.length} results found</span>
                                </div>
                                
                                {searchResults.slice(0, 8).map((product) => (
                                    <button
                                        key={product._id}
                                        onClick={() => goToProduct(product)}
                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 flex justify-between items-center transition-colors"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {highlightMatch(product.name, searchTerm)}
                                            </p>
                                            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800">PKR {product.price}</span>
                                    </button>
                                ))}
                                
                                {searchResults.length > 8 && (
                                    <button 
                                        onClick={() => { navigate(`/products?search=${searchTerm}`); clearSearch(); }}
                                        className="w-full text-center py-2 text-sm text-blue-600 hover:bg-blue-50 border-t"
                                    >
                                        View all {searchResults.length} results →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ============ NOTIFICATIONS ============ */}
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                        >
                            <FaBell className="text-xl text-gray-600" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border z-50 max-h-[500px] overflow-hidden">
                                {/* Header */}
                                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                                    <h3 className="font-semibold text-gray-800">
                                        Notifications
                                        {unreadCount > 0 && (
                                            <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </h3>
                                    <div className="flex gap-2">
                                        {notifications.length > 0 && (
                                            <button 
                                                onClick={deleteAllNotifications}
                                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Notification List */}
                                <div className="overflow-y-auto max-h-80">
                                    {notifications.length > 0 ? (
                                        notifications.map((notif) => (
                                            <button
                                                key={notif._id}
                                                onClick={() => handleNotifClick(notif)}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors flex items-start gap-3"
                                            >
                                                <span className="text-xl">{getIcon(notif.type)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-sm font-medium text-gray-800 truncate">
                                                            {notif.title}
                                                        </p>
                                                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                                            {getTimeAgo(notif.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                                        {notif.message}
                                                    </p>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center">
                                            <p className="text-4xl mb-2">✅</p>
                                            <p className="text-gray-500 text-sm">All caught up!</p>
                                            <p className="text-xs text-gray-400 mt-1">No new notifications</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile */}
                    <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.role === 1 ? 'Admin' : 'Staff'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;