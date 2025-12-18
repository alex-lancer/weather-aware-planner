// Generic retry wrapper that can be applied to any async request/action
// Default: up to 5 attempts with exponential backoff starting at 200ms

export type RetryOptions = {
  retries?: number; // number of retries after the initial attempt (total attempts = retries)
  initialDelayMs?: number; // base delay before the first retry
  factor?: number; // backoff multiplier
  maxDelayMs?: number; // optional cap for delay
  // Predicate to decide if an error is retriable. Return true to retry.
  retryOnError?: (error: unknown, attempt: number) => boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes an async action with retries.
 * The action receives the current attempt number (1-based).
 *
 * Defaults: 5 attempts total (1 initial + up to 4 retries), 200ms initial delay, x2 backoff.
 */
export async function withRetry<T>(
  action: (attempt: number) => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const {
    retries = 5,
    initialDelayMs = 200,
    factor = 2,
    maxDelayMs,
    retryOnError = () => true,
  } = opts;

  let attempt = 0;
  let delay = initialDelayMs;

  const totalAttempts = Math.max(1, retries);

  while (true) {
    attempt += 1;
    try {
      return await action(attempt);
    } catch (err) {
      if (attempt >= totalAttempts || !retryOnError(err, attempt)) {
        throw err;
      }
      const toWait = maxDelayMs != null ? Math.min(delay, maxDelayMs) : delay;

      if (toWait > 0) {
        await sleep(toWait);
      }

      delay = Math.max(0, Math.floor(delay * factor));
    }
  }
}

// Function wrapper: returns a function with the same signature that will be executed with retries
export function withRetryFn<Args extends any[], R>(
  fn: (...args: Args) => Promise<R> | R,
  opts: RetryOptions = {}
): (...args: Args) => Promise<R> {
  return async (...args: Args): Promise<R> => {
    return withRetry<R>(() => Promise.resolve(fn(...args)), opts);
  };
}
