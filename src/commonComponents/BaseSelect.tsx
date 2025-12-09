import React from 'react';

export interface BaseSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  // keep open for future props like error state, etc.
}

export default function BaseSelect({ className = '', ...rest }: BaseSelectProps) {
  const base = 'rounded-lg border px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700';
  const classes = [base, className].filter(Boolean).join(' ');
  return <select className={classes} {...rest} />;
}
