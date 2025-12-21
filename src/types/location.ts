import { Coords } from "./weather";

export const DEFAULT_CITY = "Seattle";
export const DEFAULT_COORDS: Coords = { lat: 47.6062, lon: -122.3321 };

export type GeocodeResult = Coords | null;

export type GeocodeCity = (city: string) => Promise<GeocodeResult>;

export type SearchCities = (query: string) => Promise<string[]>;
