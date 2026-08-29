import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, LineChart, ResponsiveContainer, type LegendPayload } from "recharts";
import { useEffect, useState, type CSSProperties } from "react";
import { getTyreDegradation } from "../api/client";
import type { DegradationResult, DriverPoint } from "../types/f1";
import { BoxplotChart } from "./BoxPlotChart";
import { Activity, Timer, MoveDownRight, CirclePause } from "lucide-react";


const customLegend: CSSProperties = {
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    padding: '4px',
}

type ViewMode = 'Lap Time' | 'Distribution' | 'Tyre Deg'

export function TyreDegradationChartSingle({ year, round, driver, driverData }
    :{ year: number; round: number; driver: string; driverData: DriverPoint[] | null; }){
    const [data, setData] = useState<DegradationResult | null>(null);
    // const [results, setResults] = useState<Record<string, DegradationResult> | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('Lap Time')

    const COMPOUND_COLOR: Record<string, string> = {
        SOFT: "var(--compound-soft)",
        MEDIUM: "var(--compound-medium)",
        HARD: "var(--compound-hard)",
    };

    const compunds = Array.from(new Set(data?.points.map((p) => p.compound)));


    function formatLapTime(totalSeconds: number): string {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = (totalSeconds % 60).toFixed(3);
        return `${minutes}:${seconds.padStart(6, "0")}`;
    }

    useEffect(() => {
        setLoading(true);
        getTyreDegradation(year, round, driver).then(setData).finally(() => setLoading(false));
    }, [year, round, driver]);
    
    if (loading) return <p>Loading...</p>;
    if (!data) return <p>No data</p>;

    
    const stintCompound: Record<number, string> = {};
    data.points.forEach((p) => {
        if (!(p.stint in stintCompound)) stintCompound[p.stint] = p.compound;
    });

    const degradationByStint = Object.entries(data.slope).map(([stintStr, slopeValue]) => ({
        stint: Number(stintStr),
        compound: stintCompound[Number(stintStr)] ?? "N/D",
        slope: slopeValue,
    }));

    const fastestLap = Math.min(...data.points.map((p) => p.lap_time));
    const avgLapTime = data.points.reduce((sum, p) => sum + p.lap_time, 0) / data.points.length;
    const totalStints = new Set(data.points.map((p) => p.stint)).size;
    const lineColor = driverData?.find((d) => d.Abbreviation === driver)?.TeamColor ?? "var(--accent-fastest)"; 
    const lineData = data.points.map((point) => {
        const row: Record<string, number | string | null> = {
            lap_number: point.lap_number
        };

        compunds.forEach((compound) => {
            row[compound] = point.compound === compound ? point.lap_time : null;
        });

        return row;
    });

    
    return (
            <div className="main">
                <div className="stat-row" style={{ ["--driver-color" as string]: lineColor }}>
                    <div className="stat-card">
                        <span className="stat-card__label"><MoveDownRight size="18px"/> Degradation Coeff.</span>
                        {degradationByStint.map(({ stint, compound, slope }) => (
                            <div key={stint} className="stat-card__row">
                            <span className="stat-card__dot" style={{ background: COMPOUND_COLOR[compound] ?? "#999" }}></span>
                            <span className="stat_card__compound" style={{ color: COMPOUND_COLOR[compound] ?? "var(--text)" }}>{compound}</span>
                            <span className="stat_card__value">{(Math.round(slope * 1000) / 1000).toFixed(3)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="stat-card">
                        <span className="stat-card__label"><CirclePause size="18px"/> Number of stints</span>
                        <span className="stat-card__big" >{totalStints}</span>
                        </div>
                    <div className="stat-card">
                        <span className="stat-card__label"><Timer size="18px"/> Fastest Lap</span>
                        <span className="stat-card__big" style={{ color: "var(--accent-fastest)" }}>{formatLapTime(fastestLap)}</span>
                        </div>
                    <div className="stat-card">
                        <span className="stat-card__label"><Activity size="18px"/> Average Lap</span>
                        <span className="stat-card__big" style={{ color: "var(--accent-pb)" }}>{formatLapTime(avgLapTime)}</span>
                    </div>

                </div>
                {/* <h2 className="chart-card__title">Tyre Analysis</h2> */}
                <div className="toggle-group" style={{ ["--driver-color" as string]: lineColor }}>
                        <button className={`toggle-btn ${viewMode === "Tyre Deg" ? "toggle-btn--active" : ""}`} onClick={() => setViewMode("Tyre Deg")}>Tyre Degradation</button>
                        <button className={`toggle-btn ${viewMode === "Lap Time" ? "toggle-btn--active" : ""}`} onClick={() => setViewMode("Lap Time")}>Lap Time</button>
                        <button className={`toggle-btn ${viewMode === "Distribution" ? "toggle-btn--active" : ""}`} onClick={() => setViewMode("Distribution")}>Distribution</button>
                </div>
                <div className="tyre-row">
                    
                    <div className="chart-card">
                        {viewMode === "Tyre Deg" ? (
                            <ResponsiveContainer width="100%" height={320}>
                                <ScatterChart >
                                    <CartesianGrid stroke="var(--line)"/>
                                    <XAxis type="number" dataKey="tyre_life" name="Tyre Life" style={{ fontSize: "11px" }} domain={["dataMin","dataMax +2"]} />
                                    <YAxis type="number" dataKey="corrected_lap_time" name="Lap Time" domain={["dataMin - 0.5", "dataMax + 0.5"]} tickFormatter={formatLapTime} style={{ fontSize: "11px" }} />
                                    <Tooltip
                                    contentStyle={{
                                        background: "var(--bg-panel)",
                                        border: "1px solid var(--line)",
                                        borderRadius: "var(--radius)",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "9px",
                                    }}
                                    labelStyle={{ color: "var(--text-muted)"}}
                                    labelFormatter={(value: number) => `${(Math.round(value/100)*100).toFixed(0)}`}   
                                    formatter={(value: number) => formatLapTime(value)}/>
                                    <Legend 
                                    wrapperStyle={customLegend}/>
                                    {compunds.map((compound) => (
                                        <Scatter 
                                        key={compound} 
                                        name={compound} 
                                        data={data.points.filter((p) => p.compound === compound)}
                                        fill={COMPOUND_COLOR[compound] ?? "#999"}
                                        />
                                    ))}
                                </ScatterChart>
                            </ResponsiveContainer>
                        ) : viewMode === "Lap Time" ? (
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart data={lineData}>
                                    <CartesianGrid stroke="var(--line)"/>
                                    <XAxis dataKey="lap_number" name="Lap Number" style={{ fontSize: "11px" }}/>
                                    <YAxis tickFormatter={formatLapTime} domain={["dataMin - 1","dataMax + 1"]} style={{ fontSize: "11px" }}/>
                                    <Tooltip
                                    contentStyle={{
                                        background: "var(--bg-panel)",
                                        border: "1px solid var(--line)",
                                        borderRadius: "var(--radius)",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "11px",
                                    }}
                                    labelStyle={{ color: "var(--text-muted)" }}
                                    labelFormatter={(value: number) => `Lap : ${value}`}
                                    formatter={(value: number) => `Time : ${formatLapTime(value)}`} />
                                    <Legend 
                                    wrapperStyle={customLegend}/>
                                    {compunds.map((compound) => (
                                        <Line key={compound} type="monotone"  dataKey={compound} name={compound} dot={false} connectNulls={false} strokeWidth={2} stroke={COMPOUND_COLOR[compound] ?? "var(--accent-fastest)"} isAnimationActive={false} />
                                        
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            // <ResponsiveContainer width="100%" height={320}>
                            <div style={{ width: "100%" }}>
                                <BoxplotChart data={data.distribution} colorMap={COMPOUND_COLOR} height={320}></BoxplotChart>
                            </div>
                            // </ResponsiveContainer>
                        )
                    }
                    </div>
                </div>
            </div>
    );
}