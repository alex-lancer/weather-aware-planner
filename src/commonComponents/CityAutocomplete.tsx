import React from 'react';
import { searchCities } from '../providers/NominatimProfider';

export interface CityAutocompleteProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  defaultValue?: string;
}

type Suggestion = string;

const baseInputClass = 'rounded-lg border px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700';

const cache = new Map<string, Suggestion[]>();

export default function CityAutocomplete({
  name,
  defaultValue = '',
  className = '',
  placeholder = 'City',
  onChange,
  onBlur,
  onKeyDown,
  ...rest
}: CityAutocompleteProps) {
  const [value, setValue] = React.useState<string>(defaultValue);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<Suggestion[]>([]);
  const [highlight, setHighlight] = React.useState<number>(-1);

  const abortRef = React.useRef<AbortController | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    // Debounced fetch
    if (!value.trim()) {
      setItems([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      try {
        const key = value.trim();
        if (cache.has(key)) {
          setItems(cache.get(key) || []);
          setOpen((cache.get(key) || []).length > 0);
          setLoading(false);
          setHighlight(-1);
          return;
        }
        const list = await searchCities(key);
        cache.set(key, list);
        setItems(list);
        setOpen(list.length > 0);
      } catch {
        // ignore
      } finally {
        setLoading(false);
        setHighlight(-1);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [value]);

  React.useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHighlight(-1);
      }
    }
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  function select(val: string) {
    setValue(val);
    setOpen(false);
    setHighlight(-1);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDown) onKeyDown(e);
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(items.length > 0);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      if (highlight >= 0 && highlight < items.length) {
        e.preventDefault();
        select(items[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlight(-1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (onChange) onChange(e);
  };

  const inputClasses = [baseInputClass, className].filter(Boolean).join(' ');

  return (
    <div ref={rootRef} className="relative flex-1">
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => items.length && setOpen(true)}
        placeholder={placeholder}
        className={inputClasses}
        autoComplete="off"
        {...rest}
      />
      {open && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-white text-sm shadow-lg dark:bg-neutral-900 dark:border-neutral-700">
          {loading && items.length === 0 ? (
            <li className="px-3 py-2 text-gray-500">Searching…</li>
          ) : items.length === 0 ? (
            <li className="px-3 py-2 text-gray-500">No matches</li>
          ) : (
            items.map((s, i) => (
              <li
                key={s}
                className={[
                  'px-3 py-2 cursor-pointer',
                  i === highlight ? 'bg-blue-50 dark:bg-blue-900/30' : '',
                ].join(' ')}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(s)}
                role="option"
                aria-selected={i === highlight}
              >
                {s}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
