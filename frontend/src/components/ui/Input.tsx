import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="input-group">
        {label && (
          <label
            htmlFor={inputId}
            className="input-label"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={cn(
            'input',
            error && 'input-error',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="input-error-text" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="input-helper-text">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
