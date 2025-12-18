import { withRetry, withRetryFn } from 'utilities/Retry';

describe('utilities/Retry', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  test('withRetry succeeds without retry', async () => {
    const resP = withRetry(async () => 7);
    await expect(resP).resolves.toBe(7);
  });

  test('withRetry retries on error and then succeeds', async () => {
    let attempts = 0;
    const p = withRetry(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('temporary');
      return 'ok';
    }, { initialDelayMs: 0, factor: 1, retries: 5 });

    await expect(p).resolves.toBe('ok');
    expect(attempts).toBe(3);
  });

  test('withRetry respects max attempts and throws', async () => {
    let attempts = 0;
    const p = withRetry(async () => {
      attempts += 1;
      throw new Error('always');
    }, { retries: 3, initialDelayMs: 0, factor: 1 });

    await expect(p).rejects.toThrow('always');
    expect(attempts).toBe(3);
  });

  test('withRetry uses retryOnError predicate', async () => {
    let attempts = 0;
    const p = withRetry(async () => {
      attempts += 1;
      const err = new Error('boom');
      (err as any).code = attempts === 1 ? 'RETRY' : 'FATAL';
      throw err;
    }, {
      retries: 5,
      initialDelayMs: 0,
      retryOnError: (err) => (err as any)?.code === 'RETRY',
    });

    await expect(p).rejects.toThrow('boom');
    // Should stop after second attempt because predicate returns false
    expect(attempts).toBe(2);
  });

  test('withRetryFn wraps a function preserving args and retry behavior', async () => {
    const fn = jest.fn(async (a: number, b: number) => a + b);
    const wrapped = withRetryFn(fn, { retries: 1 });
    await expect(wrapped(2, 3)).resolves.toBe(5);
    expect(fn).toHaveBeenCalledWith(2, 3);
  });
});
