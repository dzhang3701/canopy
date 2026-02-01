import { cn } from '../../utils/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' &&
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        variant === 'secondary' &&
          'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
        variant === 'ghost' &&
          'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
        variant === 'danger' &&
          'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        size === 'sm' && 'px-2.5 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
