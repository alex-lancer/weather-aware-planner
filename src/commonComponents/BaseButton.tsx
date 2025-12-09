import React from 'react';

type Variant = 'primary' | 'secondary';
type Size = 'sm' | 'md';

export interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export default function BaseButton({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  type = 'button',
  ...rest
}: BaseButtonProps) {
  const base = 'rounded-lg text-white disabled:opacity-60 disabled:cursor-not-allowed';
  const sizes: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
  };
  const variants: Record<Variant, string> = {
    primary: 'bg-blue-600 hover:bg-blue-700',
    secondary: 'bg-gray-600 hover:bg-gray-700',
  };

  const classes = [base, sizes[size], variants[variant], className].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} disabled={disabled} {...rest} />
  );
}
