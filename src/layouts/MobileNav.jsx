import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Wrench,
  Package,
  Menu
} from 'lucide-react';
import { cn } from '../utils/cn';

export const MobileNav = ({ onOpenMenu }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Billing', path: '/billing', icon: Receipt },
    { name: 'Repairs', path: '/repairs', icon: Wrench },
    { name: 'Inventory', path: '/inventory', icon: Package },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg shadow-slate-900/10 no-print safe-area-pb"
    >
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all duration-150 min-h-[48px]',
              isActive
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={cn(
                  'p-1 rounded-lg transition-colors',
                  isActive && 'bg-blue-50 dark:bg-blue-950/60'
                )}
              >
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                {item.name}
              </span>
            </>
          )}
        </NavLink>
      ))}

      {/* More / Menu Drawer Toggle */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all min-h-[48px] cursor-pointer"
      >
        <div className="p-1 rounded-lg">
          <Menu className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">More</span>
      </button>
    </nav>
  );
};

export default MobileNav;
