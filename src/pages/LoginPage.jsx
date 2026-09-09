import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { config } from '../config';
import toast from 'react-hot-toast';
import {
  Laptop,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Wrench,
  Receipt,
  Boxes
} from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { shopSettings } = useShop();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Destination path (redirect back to requested page or default to Dashboard)
  const destination = location.state?.from?.pathname || '/';

  // If already logged in, redirect to dashboard immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleQuickDemo = () => {
    setUsername('admin');
    setPassword('admin123');
    setErrorMessage('');
    toast.success('Demo credentials loaded (admin / admin123)', { icon: '✨' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Please enter your username or email');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login({ username: username.trim(), password });
      toast.success(`Welcome back, ${res.user?.name || 'Administrator'}!`);
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.message || 'Invalid username or password';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden select-none font-sans">
      {/* Dynamic Background Lighting Effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Card */}
        <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-800/80 shadow-2xl shadow-blue-950/40 rounded-2xl sm:rounded-3xl p-5 sm:p-10 transition-all duration-300 hover:border-slate-700/80">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl shadow-blue-950/50 mb-4 ring-4 ring-blue-500/10">
              <img
                src="/logo.png"
                alt="PC Doctor Logo"
                className="w-14 h-14 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextSibling.style.display = 'block';
                }}
              />
              <Laptop className="w-8 h-8 text-blue-400 hidden" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {shopSettings?.shopName || 'PC Doctor'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 font-medium">
              Repair Management & POS Billing System
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-medium text-blue-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authorized Personnel Login</span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-medium flex items-center gap-2.5 animate-shake">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or admin@pcdoctor.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs py-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500/30"
                />
                <span>Remember session</span>
              </label>

              <span className="text-[11px] text-slate-500">Auto-login enabled</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          {config.isDemoLoginEnabled && (
            <div className="mt-6 pt-6 border-t border-slate-800/80">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/70 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    Demo Admin Access
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate font-mono">
                    admin / admin123
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleQuickDemo}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-xs font-medium transition-all hover:border-blue-500/40 shrink-0 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Auto-Fill</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick System Features Highlight */}
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 font-medium">
            <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800/40 flex flex-col items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-blue-400" />
              <span>POS Billing</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800/40 flex flex-col items-center gap-1">
              <Wrench className="w-3.5 h-3.5 text-indigo-400" />
              <span>Repairs Tracker</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800/40 flex flex-col items-center gap-1">
              <Boxes className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inventory POS</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-600 mt-6">
          PC Doctor v2.0 • Secure POS & Repair Station System
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
