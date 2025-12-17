/*
 Utility to cache async request responses in localStorage with a TTL (default 1 hour).

 Provides two APIs:
 - cacheWithLocalStorage(fn, options): wraps an async function and caches its resolved value.
 - LocalCache(options): method decorator equivalent (usable if experimentalDecorators are enabled).

 Notes:
 - Safe in environments without localStorage (no-op passthrough).
 - Keys are derived from function name and arguments unless a custom key() is provided.
 */

export type LocalCacheOptions<Args extends any[] = any[]> = {
  ttlMs?: number; // default 1 hour
  key?: (args: Args) => string; // custom key builder
  namespace?: string; // optional namespace prefix
  version?: string | number; // bump to invalidate old cache
};

type StoredValue<T> = {
  value: T;
  expireAt: number; // epoch ms
  v?: string | number;
};

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

function hasLocalStorage(): boolean {
  try {
    if (typeof window === 'undefined' || !('localStorage' in window)) return false;

    const k = '__lc_probe__';

    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);

    return true;
  } catch {
    return false;
  }
}

function buildKey<Args extends any[]>(
  fnName: string,
  args: Args,
  opt?: LocalCacheOptions<Args>
): string {
  if (opt?.key) return namespacedKey(opt.key(args), opt);

  const safeArgs = tryStringifyArgs(args);

  return namespacedKey(`${fnName}(${safeArgs})`, opt);
}

function namespacedKey(base: string, opt?: LocalCacheOptions): string {
  const ns = opt?.namespace ? `${opt.namespace}:` : '';
  const ver = opt?.version != null ? `:v${String(opt.version)}` : '';

  return `lc:${ns}${base}${ver}`;
}

function tryStringifyArgs(args: any[]): string {
  try {
    return JSON.stringify(args, (_k, v) => (typeof v === 'function' ? undefined : v));
  } catch {
    // Fallback to toString for non-serializable values
    try {
      return '[' + args.map((a) => String(a)).join(',') + ']';
    } catch {
      return '[unserializable]';
    }
  }
}

function readCache<T>(key: string): T | null {
  if (!hasLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredValue<T>;

    if (!parsed || typeof parsed.expireAt !== 'number') return null;

    if (Date.now() >= parsed.expireAt) {
      // expired
      window.localStorage.removeItem(key);
      return null;
    }

    return parsed.value;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T, ttlMs: number, version?: string | number): void {
  if (!hasLocalStorage()) return;
  try {
    const payload: StoredValue<T> = { value, expireAt: Date.now() + ttlMs, v: version };

    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore quota or serialization errors
  }
}

// Higher-order wrapper for async functions
export function cacheWithLocalStorage<Args extends any[], R>(
  fn: (...args: Args) => Promise<R> | R,
  options?: LocalCacheOptions<Args>
): (...args: Args) => Promise<R> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const fnName = fn.name || 'anonymous';

  return async (...args: Args): Promise<R> => {
    const key = buildKey(fnName, args, options);
    const cached = readCache<R>(key);

    if (cached !== null) return cached as R;

    const result = await Promise.resolve(fn(...args));

    writeCache<R>(key, result, ttlMs, options?.version);

    return result;
  };
}

// Method decorator factory (requires TS experimentalDecorators to be enabled where used)
export function LocalCache<Args extends any[] = any[], R = any>(options?: LocalCacheOptions<Args>) {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;

  return function (
    _target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: Args) => Promise<R> | R>
  ) {
    const original = descriptor.value;

    if (!original) return descriptor;

    const fnName = propertyKey || original.name || 'anonymous';

    descriptor.value = (async function (this: any, ...args: Args): Promise<R> {
      const key = buildKey(fnName, args, options);
      const cached = readCache<R>(key);

      if (cached !== null) return cached as R;

      const result = await Promise.resolve(original.apply(this, args));

      writeCache<R>(key, result, ttlMs, options?.version);

      return result;
    }) as any;

    return descriptor;
  };
}

export const __testing__ = { hasLocalStorage, buildKey, readCache, writeCache, DEFAULT_TTL_MS };
