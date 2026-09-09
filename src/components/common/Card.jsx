import React from 'react';
import { cn } from '../../utils/cn';

export const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-card transition-all duration-200',
        hover && 'hover:shadow-card-hover hover:border-slate-300 dark:hover:border-slate-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', title, subtitle, action }) => {
  if (title) {
    return (
      <div className={cn('flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-4', className)}>
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    );
  }
  return <div className={cn('pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-4', className)}>{children}</div>;
};

export const CardBody = ({ children, className = '' }) => {
  return <div className={cn('space-y-4', className)}>{children}</div>;
};

export const CardFooter = ({ children, className = '' }) => {
  return <div className={cn('pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3', className)}>{children}</div>;
};

export default Card;
