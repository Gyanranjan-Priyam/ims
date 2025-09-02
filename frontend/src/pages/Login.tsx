import { useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Lock, Mail } from "lucide-react";

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/login', { email, password });
      
      // Use the auth context login method
      login(res.data.user, res.data.token);
      
      // The navigation will be handled by the auth context and routing
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-sm bg-gradient-to-b from-sky-50/50 to-white rounded-3xl shadow-xl p-8 flex flex-col items-center border border-blue-100 text-black">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white mb-6 shadow-lg">
          <LogIn className="w-7 h-7 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold mb-2 text-center">
          IMS Login
        </h2>
        <p className="text-gray-500 text-sm mb-6 text-center">
          Sign in to your Inventory Management System
        </p>
        
        <div className="w-full flex flex-col gap-3 mb-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              placeholder="Email"
              type="email"
              value={email}
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              placeholder="Password"
              type="password"
              value={password}
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>
          
          <div className="w-full flex justify-between items-center">
            {error && (
              <div className="text-sm text-red-500 text-left flex-1">{error}</div>
            )}
            <button className="text-xs hover:underline font-medium text-blue-600 ml-auto">
              Forgot password?
            </button>
          </div>
        </div>
        
        <button
          onClick={() => handleLogin()}
          disabled={loading}
          className="w-full bg-gradient-to-b from-blue-600 to-blue-700 text-white font-medium py-2 rounded-xl shadow hover:brightness-105 cursor-pointer transition mb-4 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>
    </div>
  );
};

export default Login;
