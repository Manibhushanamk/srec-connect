import { cn } from '@/lib/utils';
import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, LabelHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, hint, disabled, required, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="label-text" htmlFor={props.id}>
          {label} {required && <span className="text-neon-rose">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined}
        className={cn(
          'input-field',
          error && 'border-neon-rose/50 focus:border-neon-rose focus:ring-neon-rose/20',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      />
      {error && (
        <p id={`${props.id}-error`} className="mt-1.5 text-sm text-neon-rose flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${props.id}-hint`} className="mt-1.5 text-sm text-slate-500">{hint}</p>
      )}
    </div>
  )
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, disabled, required, rows = 4, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="label-text" htmlFor={props.id}>
          {label} {required && <span className="text-neon-rose">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        disabled={disabled}
        required={required}
        rows={rows}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined}
        className={cn(
          'input-field resize-y min-h-[100px]',
          error && 'border-neon-rose/50 focus:border-neon-rose focus:ring-neon-rose/20',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      />
      {error && (
        <p id={`${props.id}-error`} className="mt-1.5 text-sm text-neon-rose flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${props.id}-hint`} className="mt-1.5 text-sm text-slate-500">{hint}</p>
      )}
    </div>
  )
);

Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, disabled, required, options = [], placeholder, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="label-text" htmlFor={props.id}>
          {label} {required && <span className="text-neon-rose">*</span>}
        </label>
      )}
      <select
        ref={ref}
        disabled={disabled}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined}
        className={cn(
          'input-field appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2394a3b8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E")] bg-[right_0.75rem_center] bg-no-repeat pr-10',
          error && 'border-neon-rose/50 focus:border-neon-rose focus:ring-neon-rose/20',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${props.id}-error`} className="mt-1.5 text-sm text-neon-rose flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${props.id}-hint`} className="mt-1.5 text-sm text-slate-500">{hint}</p>
      )}
    </div>
  )
);

Select.displayName = 'Select';

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, children, ...props }, ref) => (
    <label ref={ref} className={cn('label-text', className)} {...props}>
      {children}
    </label>
  )
);

Label.displayName = 'Label';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => (
    <div className="flex items-start gap-3">
      <input
        ref={ref}
        type="checkbox"
        id={id}
        className={cn(
          'mt-0.5 h-4 w-4 rounded-lg border-slate-700 text-brand-500 focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 focus:ring-offset-space-900 bg-space-800/60 checked:bg-brand-500 checked:border-brand-500 transition-colors',
          className
        )}
        {...props}
      />
      <div className="flex-1">
        <label htmlFor={id} className="text-sm font-medium text-slate-100 cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  )
);

Checkbox.displayName = 'Checkbox';