import { SelectHTMLAttributes, forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  options?: { label: string; value: string }[];
}

/**
 * Standardized Select component for enterprise forms.
 * * DESIGN RATIONALE:
 * We use a custom SVG/CSS arrow to ensure cross-browser consistency 
 * (Safari/Chrome/Firefox render native select dropdown arrows differently).
 * The padding-left is dynamically adjusted depending on whether an icon is passed,
 * ensuring text never overlaps the visual indicator.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, icon: Icon, options, children, ...props }, ref) => {
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
          <select
            ref={ref}
            className={`w-full appearance-none rounded border bg-background py-2 pr-10 text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
              ${Icon ? 'pl-10' : 'pl-3'}
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-border focus:border-primary'}
              ${className}
            `}
            {...props}
          >
            {options 
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          
          {/* Custom Dropdown Arrow utilizing Tailwind borders instead of inline styles */}
          <div className="pointer-events-none absolute right-3 top-4 border-solid border-b-0 border-x-[5px] border-t-[5px] border-x-transparent border-t-foreground opacity-50" />
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';