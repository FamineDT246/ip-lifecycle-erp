// src/components/forms/Input.tsx
import { InputHTMLAttributes, forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon: Icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1 block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-2.5 h-5 w-5 text-foreground opacity-50" />
          )}
          <input
            ref={ref}
            className={`w-full rounded border bg-background py-2 pr-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors
              ${Icon ? 'pl-10' : 'pl-3'}
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-border focus:border-primary'}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';