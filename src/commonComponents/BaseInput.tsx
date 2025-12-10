import React from 'react';

export interface BaseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export default function BaseInput({ className = '', type = 'text', ...rest }: BaseInputProps) {
  const base = 'rounded-lg border px-3 py-2 text-sm w-full dark:bg-neutral-900 dark:border-neutral-700';
  const classes = [base, className].filter(Boolean).join(' ');
  return <input type={type} className={classes} {...rest} />;
}
