import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = 'md', className = '', children, ...rest }, ref) => (
    <div
      ref={ref}
      className={[
        'rounded-lg border border-neutral-200 bg-white shadow-sm',
        paddings[padding],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  ),
);

Card.displayName = 'Card';
