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
        <div className="h-[76px] px-3.5 flex items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <NavLink
            to="/"
            onClick={() => isMobileOpen && onCloseMobile()}
            className="flex items-center gap-3 min-w-0 group cursor-pointer"
          >
            <div className="relative shrink-0">
              {/* Glowing animated aura */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 opacity-40 blur-sm group-hover:opacity-85 transition duration-500 animate-glow" />
              
              <div className="relative w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center p-1 shadow-xl shadow-slate-900/30 ring-2 ring-slate-800/70 overflow-hidden shrink-0 group-hover:scale-105 transition-all duration-300 animate-float">
                <img
                  src="/logo.png"
                  alt="PC Doctor Logo"
                  className="w-full h-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl">
                  <Laptop className="w-7 h-7" />
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-base font-black text-slate-900 dark:text-white truncate tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {shopSettings?.shopName || 'PC Doctor'}
              </h1>
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent font-bold">
                  POS & Repair
                </span>
              </div>
            </div>
          </NavLink>

          {/* Close button for Mobile Drawer */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close Navigation Menu"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden shrink-0 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/25 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100 hover:translate-x-1'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-all duration-200',
                      isActive
                        ? 'text-white scale-105'
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-110'
                    )}
                  />
                  <span className="truncate transition-transform duration-200">{item.name}</span>
                  {item.highlight && !isActive && (
                    <span className="ml-auto relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2.5 group/user hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-blue-500/20 shrink-0 group-hover/user:scale-105 transition-transform duration-200">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {user?.name || 'Dr. PC Admin'}
                </p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 capitalize font-medium truncate flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span>{user?.role || 'admin'} • Online</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all duration-200 hover:rotate-12 hover:scale-110 shrink-0 cursor-pointer"
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

