import { LoaderData, DEFAULT_CITY } from "types";

export function meta({ data }: { data: LoaderData }) {
    return [
        { title: `Planner – ${data?.city ?? DEFAULT_CITY}` },
        { name: "description", content: "Weather-aware weekly planning" },
    ];
}
