import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps {
  className?: string;
  children: ReactNode;
}

export const Card = ({ className, children }: CardProps) => (
  <div className={cn('rounded-2xl border border-white/5 bg-slate-900/70 p-6 shadow-xl', className)}>
    {children}
  </div>
);

export const CardHeader = ({ className, children }: CardProps) => (
  <div className={cn('mb-3 flex items-center justify-between gap-2', className)}>{children}</div>
);

export const CardTitle = ({ className, children }: CardProps) => (
  <h3 className={cn('text-sm font-medium uppercase tracking-wider text-slate-300', className)}>
    {children}
  </h3>
);

export const CardContent = ({ className, children }: CardProps) => (
  <div className={cn('text-slate-100', className)}>{children}</div>
);
