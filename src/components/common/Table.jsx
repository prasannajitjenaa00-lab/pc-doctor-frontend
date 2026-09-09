import React from 'react';
import { cn } from '../../utils/cn';

export const Table = ({ children, className = '' }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 touch-pan-x overscroll-x-contain">
      <table className={cn('w-full text-left text-sm text-slate-700 dark:text-slate-300', className)}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children, className = '' }) => {
  return (
    <thead className={cn('bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider', className)}>
      {children}
    </thead>
  );
};

export const TableBody = ({ children, className = '' }) => {
  return (
    <tbody className={cn('divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900', className)}>
      {children}
    </tbody>
  );
};

export const TableRow = ({ children, className = '', hover = true, onClick }) => {
  return (
    <tr
      onClick={onClick}
      className={cn(
        hover && 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </tr>
  );
};

export const TableHead = ({ children, className = '', align = 'left' }) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th scope="col" className={cn('px-3 sm:px-4 py-2.5 sm:py-3.5 text-xs', alignClass, className)}>
      {children}
    </th>
  );
};

export const TableCell = ({ children, className = '', align = 'left' }) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <td className={cn('px-3 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-sm whitespace-nowrap', alignClass, className)}>
      {children}
    </td>
  );
};

export const TableEmpty = ({ message = 'No data available', colSpan = 6, icon: Icon }) => {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-slate-400 dark:text-slate-500">
        {Icon && <Icon className="w-10 h-10 mx-auto mb-2 opacity-40" />}
        <p className="text-sm font-medium">{message}</p>
      </td>
    </tr>
  );
};

export default Table;
