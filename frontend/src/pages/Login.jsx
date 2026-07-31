import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEnvelope, FaLock, FaCar } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('https://amb-auto-wheel-pos.onrender.com/api/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;

      // console.log("Login response:", user);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setUser(user);

      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
  <div
    className="min-h-screen bg-cover bg-center bg-no-repeat relative flex items-center justify-center px-4"
    style={{ backgroundImage: "url('/backgroundLoginImg.jpg')" }}
  >


      


    {/* Dark Overlay */}
    <div className="absolute inset-0 bg-black/70"></div>

    {/* Content */}
    <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-10 items-center">

      {/* Left Side */}
      <div className="hidden lg:flex flex-col text-white">
        <img
          src="/amblogoblack.jpg"
          alt="AMB Logo"
          className="w-24 h-24 rounded-full border-4 border-white shadow-xl mb-6"
        />

        <h1 className="text-5xl font-extrabold leading-tight">
          AMB Auto Wheel
        </h1>

        <p className="text-xl mt-4 text-gray-200 max-w-lg">
          Professional Auto Workshop Management System for
          invoices, inventory, services, customers, and
          transactions.
        </p>

        <div className="mt-10 space-y-3 text-lg">
          <div>✔ Professional Workshop Management</div>
          <div>✔ Inventory & Product Tracking</div>
          <div>✔ Invoice & Billing System</div>
          <div>✔ Customer & Service Records</div>
        </div>
      </div>

      {/* Right Side Login Card */}
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20">

        <div className="text-center mb-8">

          <img
            src="/AmbLogo.jpg"
            alt="AMB Logo"
            className="w-20 h-20 mx-auto rounded-full border-4 border-blue-600 shadow-lg"
          />

          <h2 className="text-3xl font-bold text-gray-800 mt-5">
            Welcome Back
          </h2>

          <p className="text-gray-500 mt-2">
            Login to continue to your dashboard
          </p>

        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>

            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>

            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none transition"
              />
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold text-lg transition-all duration-300 hover:scale-[1.02] shadow-lg disabled:opacity-70"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <span className="spinner w-5 h-5"></span>
                Logging in...
              </div>
            ) : (
              "Login"
            )}
          </button>

        </form>

        <div className="mt-8 text-center border-t pt-6">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-600 font-semibold hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>

      </div>
    </div>
  </div>
);
};

export default Login;