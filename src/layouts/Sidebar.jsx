import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Wrench,
  Package,
  Boxes,
  Tags,
  Users,
  Truck,
  WalletCards,
  BarChart3,
  Settings,
  Laptop,
  LogOut,
  X
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

const navigationItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Billing (POS)', path: '/billing', icon: Receipt, highlight: true },
  { name: 'Repair Jobs', path: '/repairs', icon: Wrench, highlight: true },
  { name: 'Inventory', path: '/inventory', icon: Package },
  { name: 'Products', path: '/products', icon: Boxes },
  { name: 'Categories', path: '/categories', icon: Tags },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Suppliers', path: '/suppliers', icon: Truck },
  { name: 'Expenses', path: '/expenses', icon: WalletCards },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Shop Settings', path: '/settings', icon: Settings },
];

export const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { shopSettings } = useShop();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden no-print"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out no-print',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <NavLink
            to="/"
            onClick={() => isMobileOpen && onCloseMobile()}
            className="flex items-center gap-2.5 min-w-0 group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-slate-950 flex items-center justify-center p-0.5 shadow-md shadow-slate-900/10 ring-2 ring-slate-800/40 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="PC Doctor Logo"
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-full items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl">
                <Laptop className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-extrabold text-slate-900 dark:text-white truncate tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {shopSettings?.shopName || 'PC Doctor'}
              </h1>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                POS & Repair System
              </p>
            </div>
          </NavLink>

          {/* Close button for Mobile Drawer */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close Navigation Menu"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                  {item.highlight && !isActive && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-blue-500/20 shrink-0">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {user?.name || 'Dr. PC Admin'}
                </p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 capitalize font-medium truncate">
                  {user?.role || 'admin'} • Online
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
