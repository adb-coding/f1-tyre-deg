import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ResponsiveContainer } from "recharts";
import { useEffect, useState, type CSSProperties } from "react";
import type { DegradationResult, DriverPoint } from "../types/f1";
import { getTyreDegradation } from "../api/client"

const customLegend: CSSProperties = {
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    padding: '4px',
}


type ViewMode = 'Speed' | 'Gear' | 'Throttle' | 'RPM'    

const VIEW_CONFIG: Record<ViewMode, {dataKey: string, name: string, formatter: (v: number) => string }> = {
    Speed: { dataKey: "Speed", name: "Speed", formatter: (v) => `${v.toFixed(1)} km/h` },
    Gear: { dataKey: "nGear", name: "Gear", formatter: (v) => `${Math.round(v)}`},
    Throttle: { dataKey: "Throttle", name: "Throttle", formatter: (v) => `${v.toFixed(2)}`},
    RPM: { dataKey: "RPM", name: 'RPM', formatter: (v) => (v.toFixed(2))},
}

export function TelemetryChartSingle({ year, round, driver, driverData }:{ year: number; round: number; driver: string, driverData: DriverPoint[] | null; }){    
    
    const [viewMode, setViewMode] = useState<ViewMode>('Speed')
    const [data, setData] = useState<DegradationResult | null>(null);
    const [loading, setLoading] = useState(true);
    

    function formatDistance(Distance: number): string {
        const distance = (Math.round(Distance * 100) / 100).toFixed(2)
        return `${distance}`
    }

        useEffect(() => {
            setLoading(true);
            getTyreDegradation(year, round, driver)
            .then(setData)
            .finally(() => setLoading(false));
        }, [year, round, driver]);

        if (loading) return <p>Loading...</p>;
        if (!data) return <p>No data</p>;

        const lineColor = driverData?.find((d) => d.Abbreviation === driver)?.TeamColor ?? "var(--accent-fastest)"; 
        const config = VIEW_CONFIG[viewMode];



        return (
            <div>
                <h2 className="chart-card__title">Telemetry</h2>
                <div className="toggle-group" style={{ ["--driver-color" as string]: lineColor }}>
                    {(Object.keys(VIEW_CONFIG) as ViewMode[]).map((mode) => (
                        <button
                        key={mode}
                        className={`toggle-btn ${mode === viewMode ? "toggle-btn--active": ""}`}
                        onClick={() => setViewMode(mode)} 
                        >
                            {VIEW_CONFIG[mode].name}
                        </button>
                    ))}
                </div>
                <div className="telemetry-row">
                    <div className="chart-card">
                    {/* <h2 className="chart-card__title">Telemetry Chart</h2> */}
                        <ResponsiveContainer width="100%" height={320} style={{ margin: "6px"}}>
                            <LineChart data={data.telemetry} syncId="telemetry-track">
                                <CartesianGrid stroke="var(--line)" />
                                <XAxis dataKey="Distance" name="Distance" tick={{ fill: "var(--text-muted)"}} domain={["dataMin","dataMax"]} tickFormatter={(value: number) => formatDistance(value)} style={{ fontSize: "11px" }}/>
                                <YAxis dataKey={config.dataKey} name={config.name} domain={["dataMin","dataMax"]} style={{ fontSize: "11px" }}/>
                                <Tooltip
                                contentStyle={{
                                    background: "var(--bg-panel)",
                                    border: "1px solid var(--line)",
                                    borderRadius: "var(--radius)",
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "9px",
                                }}
                                labelStyle={{ color: "var(--fastest-accent)"}}
                                formatter={(value) => {config.formatter(Number(value))}}
                                labelFormatter={(value) => `Distance : ${formatDistance(Number(value))} m`} 
                                />
                                <Legend 
                                wrapperStyle={customLegend}/>
                                <Line
                                type="monotone" dataKey={config.dataKey} strokeWidth={3} stroke={lineColor} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
        </div>
        );
}