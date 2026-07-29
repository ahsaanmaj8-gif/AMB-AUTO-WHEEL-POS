import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaUser, FaEnvelope, FaPhone, FaHome, FaLock } from 'react-icons/fa';
import { Link } from 'react-router-dom';  // ✅ Add this import
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  // ============ PASSWORD STATE ============
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // ============ HANDLE PROFILE CHANGE ============
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // ============ HANDLE PASSWORD CHANGE ============
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  // ============ UPDATE PROFILE ============
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(
        'https://amb-auto-wheel-pos.onrender.com/api/users/profile',
        formData
      );
      
      setUser(response.data.user);
      toast.success('✅ Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // ============ UPDATE PASSWORD ============
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      toast.error('Please enter current password');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await axios.put(
        'https://amb-auto-wheel-pos.onrender.com/api/users/password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }
      );
      
      toast.success('✅ Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* ============ HEADER ============ */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
        <p className="text-gray-500">Manage your account information</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* ============ PROFILE CARD ============ */}
        <div className="card md:col-span-1 text-center">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-5xl font-bold mb-4 shadow-lg">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h3 className="text-xl font-semibold text-gray-800">{user?.name}</h3>
            <p className={`text-sm ${user?.role === 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
              {user?.role === 1 ? '👑 Administrator' : '👤 Staff'}
            </p>
            <div className="mt-4 w-full border-t pt-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Member since:</span>{' '}
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* ============ PROFILE FORM ============ */}
        <div className="card md:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Account Information</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`text-sm font-medium transition-colors ${
                isEditing ? 'text-red-600 hover:text-red-800' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              {isEditing ? '✖ Cancel' : '✏️ Edit Profile'}
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`input-field pl-10 ${!isEditing ? 'bg-gray-50' : ''}`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`input-field pl-10 ${!isEditing ? 'bg-gray-50' : ''}`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Phone Number</label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`input-field pl-10 ${!isEditing ? 'bg-gray-50' : ''}`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Address</label>
                <div className="relative">
                  <FaHome className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`input-field pl-10 ${!isEditing ? 'bg-gray-50' : ''}`}
                  />
                </div>
              </div>

              {isEditing && (
                <button 
                  type="submit" 
                  className="btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : '💾 Save Changes'}
                </button>
              )}
            </div>
          </form>

          {/* ============ CHANGE PASSWORD SECTION ============ */}
          <div className="mt-8 border-t pt-6">
            <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <FaLock className="text-gray-500" /> Change Password
            </h4>
            
            <form onSubmit={handlePasswordSubmit}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Current Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="input-field pl-10"
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="label">New Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="input-field pl-10"
                      placeholder="Enter new password"
                      required
                      minLength="6"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="label">Confirm New Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="input-field pl-10"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : '🔒 Update Password'}
                </button>

                {/* ✅ FORGOT PASSWORD BUTTON - PLACED HERE */}
                <Link 
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;