import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, LineChart, ResponsiveContainer, type LegendPayload } from "recharts";
import { useEffect, useState, type CSSProperties } from "react";
import { getTyreDegradationMulti } from "../api/client";
import type { DegradationResult, DriverPoint } from "../types/f1";
import { Timer, Activity, MoveDownRight, CirclePause } from 'lucide-react'



const customLegend: CSSProperties = {
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    padding: '4px',
}

type ViewMode = 'Lap Time' | 'Distribution' | 'Tyre Deg'

function formatLapTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(3);
    return `${minutes}:${seconds.padStart(6, "0")}`;
}

function mergeLapsByNumber(results: Record<string, DegradationResult>): Record<string, number | undefined>[]{
        const lapMap = new Map<number, Record<string, number | undefined>>();
        for (const [driverCode, result] of Object.entries(results)) {
            for (const point of result.points) {
                if (!lapMap.has(point.lap_number)) lapMap.set(point.lap_number, { lap_number: point.lap_number });
                lapMap.get(point.lap_number)![driverCode] = point.lap_time;
            }
        } 
        return Array.from(lapMap.values()).sort((a, b) => (a.lap_number as number) - (b.lap_number as number));
    } 
    
    interface Props {
        year: number; round: number; drivers: string[]; driverData: DriverPoint[] | null;
}


export function TyreDegradationChartMulti({ year, round, drivers, driverData }: Props) {
    const [results, setResults] = useState<Record<string, DegradationResult> | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('Lap Time');
    const [activeKey, setActiveKey] = useState<string | null>(null);
    
    const COMPOUND_COLOR: Record<string, string> = {
        SOFT: "var(--compound-soft)",
        MEDIUM: "var(--compound-medium)",
        HARD: "var(--compound-hard)",
    };
    
    useEffect(() => {
        setLoading(true);
        getTyreDegradationMulti(year, round, drivers).then(setResults).finally(() => setLoading(false));
    }, [year, round, drivers]);
    
    if (loading) return <p>Loading...</p>;
    if (!results) return <p>No data</p>;
    
    const mergedLaps = mergeLapsByNumber(results);
    const driverCode = Object.keys(results);
    const colorFor = (code: string) => driverData?.find((d) => d.Abbreviation === code)?.TeamColor ?? "#999";
    
    const fastestLapByDriver = driverCode.map((code) => ({
       code,
       color: colorFor(code),
       time: Math.min(...results[code].points.map((p) => p.lap_time)), 
    })).sort((a, b) => a.time - b.time);

    // const computeDegradatoinByStint(result: DegradationResult) {
    //     const stintCompound: Record<number, string> = {};
    //     result.points.forEach((p) => {
    //         if (!(p.stint in stintCompound)) stintCompound[p.stint] = p.compound;
    //     });
    //     return Object.entries(result.slope).map(([stintStr, slopeValue]) => {
    //         stint: Number(stintStr),
    //         compound: stintCompound[Number(stintStr)] ?? "N/D",
    //         slope: slopeValue
    //     })
    // }


    return (
        <div className="main">
            <div className="stat-row">
                    {/* <div className="stat-card"> */}
                        {/* <span className="stat-card__label"><MoveDownRight size="18px"/> Degradation Coeff.</span>
                        {driverCode.map((code) => (
                            <div className="stat-card__row">
                            {/* <span className="stat-card__dot" style={{ background: COMPOUND_COLOR[compound] ?? "#999" }}></span> */}
                            {/* <span className="stat_card__compound" style={{ color: COMPOUND_COLOR[compound] ?? "var(--text)" }}>{compound}</span> */}
                            {/* <span className="stat_card__value">{(Math.round(results[code].slope[0] * 1000) / 1000).toFixed(3)}</span> */}
                            {/* </div> */}
                        {/* ))} */} 
                    {/* </div> */}
                    <div className="stat-card">
                        <span className="stat-card__label"><CirclePause size="18px"/> Number of stints</span>
                        <span className="stat-card__big" >totalStints</span>
                        </div>
                    <div className="stat-card">
                        <span className="stat-card__label"><Timer size="18px"/> Fastest Lap</span>
                        {fastestLapByDriver.slice(0,2).map(({ code, color, time}) => (
                            <div key={code} className="stat-card__row">
                                <span className="stat-card__dot" 
                                style={{background: color, width: "6px", height: "6px", margin: "4px"}} />
                                <span className="stat-card__compound" style={{ marginRight: "4px"}}> {code} </span>
                                <span className="stat-card__value">{formatLapTime(time)}</span>
                            </div>    
                        ))}
                        </div>
                    <div className="stat-card">
                        <span className="stat-card__label"><Activity size="18px"/> Average Lap</span>
                        {/* <span className="stat-card__big" style={{ color: "var(--accent-pb)" }}>{formatLapTime(avgLapTime)}</span> */}
                    </div>

            </div>

            <div className="toggle-group">
                <button className={`toggle-btn ${viewMode === "Tyre Deg" ? "toggle-btn--active" : ""}`} onClick={() => setViewMode("Tyre Deg")}>Tyre Degradation</button>
                <button className={`toggle-btn ${viewMode === "Lap Time" ? "toggle-btn--active" : ""}`} onClick={() => setViewMode("Lap Time")}>Lap Time</button>
                <button className={`toggle-btn ${viewMode === "Distribution" ? "toggle-btn--active" : ""}`} onClick={() => setViewMode("Distribution")}>Distribution</button>
            </div>
            <div className="tyre-row">
                {viewMode === "Tyre Deg" ? (
                    <div className="chart-card">
                        {/* <h2 className="chart-card__title">Tyre Degradation</h2> */}
                        <ResponsiveContainer width="100%" height={320}>
                            <ScatterChart >
                                <CartesianGrid stroke="var(--line)"/>
                                <XAxis type="number" dataKey="tyre_life" name="Tyre Life" style={{ fontSize: "11px" }} />
                                <YAxis type="number" dataKey="corrected_lap_time" name="Lap Time" domain={["dataMin - 1", "dataMax + 1"]} tickFormatter={formatLapTime} style={{ fontSize: "11px" }} />
                                <Tooltip
                                contentStyle={{
                                    background: "var(--bg-panel)",
                                    border: "1px solid var(--line)",
                                    borderRadius: "var(--radius)",
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "9px",
                                }}
                                labelStyle={{ color: "var(--text-muted)"}}   
                                formatter={(value: number) => formatLapTime(value)}/>
                                <Legend 
                                wrapperStyle={customLegend}
                                onMouseEnter={(o) => setActiveKey(o.value as string)}
                                onMouseLeave={() => setActiveKey(null)}/>
                                {driverCode.map((code) => (
                                    <Scatter 
                                    key={code} 
                                    name={code} 
                                    data={results[code].points}
                                    fill={colorFor(code)}
                                    strokeOpacity={activeKey === null || activeKey === code ? 1 : 0.15}
                                    />
                                ))}
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>

                ) : viewMode === "Lap Time" ? (
                    <div className="chart-card">
                        {/* <h2 className="chart-card__title">Laps</h2> */}
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart data={mergedLaps}>
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
                                    labelStyle={{ color: "var(--fastest-accent)" }}
                                    labelFormatter={(value: number) => `Lap : ${value}`}
                                    formatter={(value: number) => `Time : ${formatLapTime(value)}`} />
                                    <Legend 
                                    wrapperStyle={customLegend}
                                    onMouseEnter={(o) => setActiveKey(o.value as string)}
                                    onMouseLeave={() => setActiveKey(null)}/>
                                    {driverCode.map((code) => (
                                        <Line key={code} type="monotone" dataKey={code} name={code} dot={false} stroke={colorFor(code)} connectNulls strokeWidt={2} strokeOpacity={activeKey === null || activeKey === code ? 1 : 0.15} />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                    </div>

                ) : (
                    <div className="chart-title">Incoming</div>
                )}
            </div>
        </div>
    );
}

