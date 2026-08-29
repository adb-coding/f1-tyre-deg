import type { DegradationResult, DriverPoint, SessionInfo } from "../types/f1";

const API_BASE = import.meta.env.VITE_API_URL;

export async function getTyreDegradation(
    year: number, round: number, driver: string
): Promise<DegradationResult>{
    const res = await fetch(`${API_BASE}/api/tyre-degradation?year=${year}&round=${round}&driver=${driver}`);
    if (!res.ok) throw new Error("Error while loading data");
    return res.json();
}

export async function getDriverPoint(
    year: number, round: number
): Promise<DriverPoint[]> {
    const res = await fetch(`${API_BASE}/api/driver-data?year=${year}&round=${round}`);
    if (!res.ok) throw new Error("Error extracting driver data");
    return res.json();
}


export async function getSessionData(
    year: number, round: number
): Promise<SessionInfo> {
    const res = await fetch(`${API_BASE}/api/session-info?year=${year}&round=${round}`);
    if (!res.ok) throw new Error("Error extracting session info data");
    return res.json();
}

export async function getTyreDegradationMulti(
    year: number, round: number, drivers: string[]
): Promise<Record<string, DegradationResult>> {
    const res = await fetch(`${API_BASE}/api/tyre-degradation/multi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, round, drivers }),
    });
    if (!res.ok) throw new Error("Error comparing drivers");
    return res.json()
}