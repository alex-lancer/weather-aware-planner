import { cacheWithLocalStorage } from 'utilities/LocalCache';

describe('utilities/LocalCache.cacheWithLocalStorage', () => {
  beforeEach(() => {
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
    jest.useRealTimers();
  });

  test('caches result for identical args', async () => {
    const fn = jest.fn(async (x: number) => x * 2);
    const cached = cacheWithLocalStorage(fn, { namespace: 'test' });

    await expect(cached(3)).resolves.toBe(6);
    await expect(cached(3)).resolves.toBe(6);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('respects TTL expiration', async () => {
    jest.useFakeTimers();
    let calls = 0;
    const fn = jest.fn(async (x: number) => { calls++; return x + calls; });
    const cached = cacheWithLocalStorage(fn, { ttlMs: 1000, namespace: 'ttl' });

    const p1 = cached(1);
    await Promise.resolve();
    await expect(p1).resolves.toBe(2); // 1st call => calls=1, 1+1=2

    // Within TTL -> should use cache
    const p2 = cached(1);
    await Promise.resolve();
    await expect(p2).resolves.toBe(2);

    expect(fn).toHaveBeenCalledTimes(1);

    // Advance past TTL
    jest.advanceTimersByTime(1001);

    const p3 = cached(1);

    await Promise.resolve();
    await expect(p3).resolves.toBe(3); // second compute: calls=2, 1+2=3
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('supports custom key, namespace, and version in storage key', async () => {
    const spy = jest.spyOn(window.localStorage.__proto__, 'setItem');
    const fn = async (a: number, b: number) => a + b;
    const cached = cacheWithLocalStorage(fn, {
      namespace: 'ns',
      version: 42,
      key: ([a, b]) => `sum:${a},${b}`,
    });

    await cached(2, 5);
    expect(spy).toHaveBeenCalled();

    const lcCall = spy.mock.calls.find(([k]) => typeof k === 'string' && (k as string).startsWith('lc:'));
    const keyArg = (lcCall || [])[0] as string;

    expect(keyArg).toContain('lc:ns');
    expect(keyArg).toContain('sum:2,5');
    expect(keyArg).toContain(':v42');
    spy.mockRestore();
  });

  test('handles unstringifiable args (circular) gracefully', async () => {
    const a: any = { n: 1 };
    a.self = a; // circular
    const fn = jest.fn(async (obj: any) => obj.n);
    const cached = cacheWithLocalStorage(fn, { namespace: 'circular', key: () => 'circular-key' });

    await expect(cached(a)).resolves.toBe(1);
    await expect(cached(a)).resolves.toBe(1);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('bypasses caching when localStorage is unavailable', async () => {
    const origSet = window.localStorage.setItem;
    (window.localStorage.setItem as any) = () => { throw new Error('denied'); };
    try {
      const fn = jest.fn(async (x: number) => x * 10);
      const cached = cacheWithLocalStorage(fn, { namespace: 'no-ls' });
      await expect(cached(2)).resolves.toBe(20);
      await expect(cached(3)).resolves.toBe(30);

      expect(fn).toHaveBeenCalledTimes(2);
    } finally {
      window.localStorage.setItem = origSet;
    }
  });
});
