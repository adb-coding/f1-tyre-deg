import type { DriverPoint } from "../types/f1";
import { TelemetryChartSingle } from "./TelemetrySingle";
import { TelemetryChartMulti } from "./TelemetryMulti";

export function TelemetryChart({ year, round, driver, driverData, mode, compareDrivers}
    :{ year: number; round: number; driver: string; driverData: DriverPoint[] | null; mode: "single" | "compare"; compareDrivers: string[];}) {

        if (mode === "single") {
            return <TelemetryChartSingle year={year} round={round} driver={driver} driverData={driverData} />
        }
         return <TelemetryChartMulti year={year} round={round} drivers={compareDrivers} driverData={driverData} /> 
    }
