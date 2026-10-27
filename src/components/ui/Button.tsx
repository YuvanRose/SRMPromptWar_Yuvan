import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/*  Variant map                                                       */
/* ------------------------------------------------------------------ */
const variants = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
  secondary:
    'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 focus-visible:ring-neutral-400',
  success:
    'bg-success-500 text-white hover:bg-success-700 focus-visible:ring-success-500',
  danger:
    'bg-danger-500 text-white hover:bg-danger-700 focus-visible:ring-danger-500',
  ghost:
    'bg-transparent text-neutral-700 hover:bg-neutral-100 focus-visible:ring-neutral-400',
  outline:
    'border border-neutral-300 bg-transparent text-neutral-700 hover:bg-neutral-50 focus-visible:ring-primary-500',
} as const;

const sizes = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-4 py-2.5 text-base min-h-touch',
  lg: 'px-6 py-3.5 text-lg min-h-[56px]',
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      className = '',
      children,
      disabled,
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        'motion-reduce:transition-none',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  ),
);

Button.displayName = 'Button';
