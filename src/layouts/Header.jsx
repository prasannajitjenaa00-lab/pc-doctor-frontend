import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  PlusCircle,
  Wrench,
  Receipt,
  Search,
  LogOut
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

export const Header = ({ onToggleMobile }) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode, shopSettings } = useShop();
  const { user, logout } = useAuth();

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between no-print">
      {/* Left: Mobile Toggle & Shop Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onToggleMobile}
          aria-label="Open Navigation Menu"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden shrink-0 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-7 h-7 object-contain md:hidden rounded-lg bg-white p-0.5 border border-slate-200 dark:border-slate-700 shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider truncate">
              {shopSettings?.shopName || 'PC Doctor'}
            </p>
            <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-medium">{todayStr}</p>
          </div>
        </div>
      </div>

      {/* Right: Quick Action Shortcuts & Dark Mode Toggle */}
      <div className="flex items-center gap-2.5">
        {/* Quick New Bill */}
        <Button
          size="sm"
          variant="primary"
          icon={Receipt}
          onClick={() => navigate('/billing')}
          className="hidden sm:inline-flex"
        >
          New Bill
        </Button>

        {/* Quick New Repair */}
        <Button
          size="sm"
          variant="secondary"
          icon={Wrench}
          onClick={() => navigate('/repairs')}
          className="hidden sm:inline-flex text-blue-600 dark:text-blue-400 hover:text-blue-700"
        >
          New Repair
        </Button>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* User Info & Quick Logout */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-blue-500/20">
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
