import React from 'react';

export interface BaseTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export default function BaseTextarea({ className = '', rows = 3, ...rest }: BaseTextareaProps) {
  const base = 'rounded-lg border px-3 py-2 text-sm w-full dark:bg-neutral-900 dark:border-neutral-700';
  const classes = [base, className].filter(Boolean).join(' ');
  return <textarea rows={rows} className={classes} {...rest} />;
}
