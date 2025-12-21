// NominatimProfider: OpenStreetMap Nominatim geocoding and search utilities
import type { GeocodeCity, SearchCities } from "types";

export const geocodeCity: GeocodeCity = async (city: string) => {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", city);
    const res = await fetch(url.toString(), {
      headers: { "Accept-Language": "en", "User-Agent": "waw-app/1.0" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
};

/**
 * Search city suggestions using OpenStreetMap Nominatim.
 * Returns up to 5 display names.
 */
export const searchCities: SearchCities = async (query: string) => {
  if (!query.trim()) return [];
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "0");
    url.searchParams.set("limit", "5");
    url.searchParams.set("q", query);
    const res = await fetch(url.toString(), {
      headers: { "Accept-Language": "en", "User-Agent": "waw-app/1.0" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ display_name?: string }>;
    const names = data.map((d) => d.display_name).filter((s): s is string => Boolean(s));
    // Deduplicate while preserving order
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const n of names) {
      if (!seen.has(n)) {
        seen.add(n);
        unique.push(n);
      }
    }
    return unique;
  } catch {
    return [];
  }
};
