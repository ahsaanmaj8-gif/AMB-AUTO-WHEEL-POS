import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEnvelope, FaLock, FaQuestionCircle, FaArrowLeft, FaCar } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1 = Email, 2 = Answer, 3 = New Password
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userFound, setUserFound] = useState(false);
  const navigate = useNavigate();

  // ============ STEP 1: VERIFY EMAIL ============
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);

    try {
      // Check if user exists with this email
      const response = await axios.post('https://amb-auto-wheel-pos.onrender.com/api/auth/check-email', {
        email
      });

      if (response.data.success) {
        setUserFound(true);
        setStep(2);
        toast.success('Email verified! Please answer your security question.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Email not found');
    } finally {
      setLoading(false);
    }
  };

  // ============ STEP 2: VERIFY ANSWER ============
  const handleVerifyAnswer = async (e) => {
    e.preventDefault();
    
    if (!answer) {
      toast.error('Please enter your security answer');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('https://amb-auto-wheel-pos.onrender.com/api/auth/verify-answer', {
        email,
        answer
      });

      if (response.data.success) {
        setStep(3);
        toast.success('Answer verified! Please enter new password.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Incorrect answer');
    } finally {
      setLoading(false);
    }
  };

  // ============ STEP 3: RESET PASSWORD ============
  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Validate password
    if (newPassword.length < 5) {
      toast.error('Password must be at least 5 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('https://amb-auto-wheel-pos.onrender.com/api/auth/forgot-password', {
        email,
        answer,
        newPassword
      });

      if (response.data.success) {
        toast.success('✅ Password reset successfully! Please login.');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // ============ GO BACK TO LOGIN ============
  const goToLogin = () => {
    navigate('/login');
  };

  // ============ STEP 1: EMAIL FORM ============
  const renderStep1 = () => (
    <form onSubmit={handleVerifyEmail} className="space-y-5">
      <div className="text-center mb-6">
        <p className="text-gray-600 text-sm">
          Enter your registered email address. We'll send you a security question.
        </p>
      </div>

      <div>
        <label className="label">Email Address</label>
        <div className="relative">
          <FaEnvelope className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field pl-10"
            placeholder="Enter your registered email"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="spinner w-5 h-5"></span>
            Verifying...
          </>
        ) : (
          'Verify Email'
        )}
      </button>

      <div className="text-center mt-4">
        <Link to="/login" className="text-sm text-blue-600 hover:underline flex items-center justify-center gap-1">
          <FaArrowLeft className="text-xs" /> Back to Login
        </Link>
      </div>
    </form>
  );

  // ============ STEP 2: ANSWER FORM ============
  const renderStep2 = () => (
    <form onSubmit={handleVerifyAnswer} className="space-y-5">
      <div className="text-center mb-6">
        <p className="text-gray-600 text-sm">
          Please answer your security question to verify your identity.
        </p>
        <div className="bg-blue-50 p-3 rounded-lg mt-3">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Security Question:</span> What is your pet's name?
          </p>
        </div>
      </div>

      <div>
        <label className="label">Your Answer</label>
        <div className="relative">
          <FaQuestionCircle className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="input-field pl-10"
            placeholder="Enter your security answer"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="spinner w-5 h-5"></span>
            Verifying...
          </>
        ) : (
          'Verify Answer'
        )}
      </button>

      <button
        type="button"
        onClick={() => setStep(1)}
        className="w-full text-sm text-gray-500 hover:text-gray-700"
      >
        ← Go Back
      </button>
    </form>
  );

  // ============ STEP 3: NEW PASSWORD FORM ============
  const renderStep3 = () => (
    <form onSubmit={handleResetPassword} className="space-y-5">
      <div className="text-center mb-6">
        <p className="text-gray-600 text-sm">
          Enter your new password below.
        </p>
      </div>

      <div>
        <label className="label">New Password</label>
        <div className="relative">
          <FaLock className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-field pl-10"
            placeholder="Enter new password (min 6 characters)"
            required
            minLength="6"
          />
        </div>
      </div>

      <div>
        <label className="label">Confirm Password</label>
        <div className="relative">
          <FaLock className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field pl-10"
            placeholder="Confirm new password"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="spinner w-5 h-5"></span>
            Resetting Password...
          </>
        ) : (
          'Reset Password'
        )}
      </button>

      <button
        type="button"
        onClick={() => setStep(2)}
        className="w-full text-sm text-gray-500 hover:text-gray-700"
      >
        ← Go Back
      </button>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FaCar className="text-3xl text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Reset Password</h1>
          <p className="text-gray-500 mt-1">
            {step === 1 && 'Forgot your password?'}
            {step === 2 && 'Security Verification'}
            {step === 3 && 'Set New Password'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Render Current Step */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default ForgotPassword;