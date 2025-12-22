export function computeRisk(d: { precip: number | null; wind: number | null; temp: number | null }):
  | "low"
  | "medium"
  | "high" {
  const rainRisk = d.precip != null && d.precip >= 40; // %
  const windRisk = d.wind != null && d.wind >= 20; // m/s ~ 22 mph
  const coldRisk = d.temp != null && d.temp <= 0; // C
  const score = [rainRisk, windRisk, coldRisk].filter(Boolean).length;

  return score >= 2 ? "high" : score === 1 ? "medium" : "low";
}
