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

export function computeRisk(d: { precip: number | null; wind: number | null; temp: number | null }):
  | "low"
  | "medium"
  | "high" {
  const rainRisk = d.precip != null && d.precip >= 40; // %
  const windRisk = d.wind != null && d.wind >= 10; // m/s ~ 22 mph
  const coldRisk = d.temp != null && d.temp <= 0; // C
  const score = [rainRisk, windRisk, coldRisk].filter(Boolean).length;

  return score >= 2 ? "high" : score === 1 ? "medium" : "low";
}

