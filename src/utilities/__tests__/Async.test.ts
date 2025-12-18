import { withTimeout } from 'utilities/Async';

describe('utilities/Async.withTimeout', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  test('resolves when promise settles before timeout', async () => {
    const p = new Promise<number>((resolve) => setTimeout(() => resolve(42), 100));
    const wrapped = withTimeout(p, 500);
    const resPromise = wrapped;

    jest.advanceTimersByTime(150);
    await expect(resPromise).resolves.toBe(42);
  });

  test('rejects with timeout when promise takes too long', async () => {
    const p = new Promise<void>(() => {}); // pending
    const wrapped = withTimeout(p, 300);
    const resPromise = wrapped;

    jest.advanceTimersByTime(301);
    await expect(resPromise).rejects.toThrow('timeout');
  });
});
