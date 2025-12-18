export function withTimeout<T>(p: Promise<T>, ms: number, _signal?: AbortSignal): Promise<T> {
  // Note: AbortSignal is accepted for potential future integration, but not used here.
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error("timeout"));
    }, ms);
    p
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}
