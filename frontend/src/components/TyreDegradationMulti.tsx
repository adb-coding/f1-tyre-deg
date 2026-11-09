import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, LineChart, ResponsiveContainer, ReferenceLine } from "recharts";
import { useEffect, useState, type CSSProperties } from "react";
import { getTyreDegradationMulti, getGap } from "../api/client";
import { COMPOUND_COLOR } from "./compounds";
import type { DegradationResult, DriverPoint, Gap } from "../types/f1";
import { Timer, Activity, CirclePause, MoveDownRight } from 'lucide-react'



const customLegend: CSSProperties = {
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    padding: '4px',
}

type ViewMode = 'Lap Time' | 'Gap' | 'Tyre Deg' | 'History'

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

function mergePositionsByLap(results: Record<string, DegradationResult>): Record<string, number | undefined>[]{
    const lapMap = new Map<number, Record<string, number | undefined>>();
    for (const [driverCode, result] of Object.entries(results)) {
        for (const point of result.position) {
            if (!lapMap.has(point.LapNumber)) lapMap.set(point.LapNumber, { LapNumber: point.LapNumber });
            lapMap.get(point.LapNumber)![driverCode] = point.Position;
        }
    }
    return Array.from(lapMap.values()).sort((a,b) => (a.LapNumber as number) - (b.LapNumber as number));
}

    
    
    export function TyreDegradationChartMulti({ year, round, drivers, driverData }: Props) {
        const [results, setResults] = useState<Record<string, DegradationResult> | null>(null);
        const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('Lap Time');
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const [gap, setGap] = useState<Gap | null>(null);
    const [error, setError] = useState(false)
    
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setResults(null);
        setError(false);
        getTyreDegradationMulti(year, round, drivers)
            .then((d) => { if (!cancelled) setResults(d); })
            .catch((e) => { console.error(e); if (!cancelled) setError(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; }; 
    }, [year, round, drivers]);

    useEffect(() => {
        let cancelled = false;
        getGap(year, round, drivers).then((g) => {if (!cancelled) setGap(g)}).catch(() => {if (!cancelled) setGap(null)});
        return () => {cancelled = true; };
    }, [year, round, drivers]);
    
    if (loading) return <p>Loading...</p>;
    if (!results) return <p>Data not available for this race</p>;
    
    const mergedLaps = mergeLapsByNumber(results);
    const driverCode = Object.keys(results);
    const mergedPositions = mergePositionsByLap(results);
    const colorFor = (code: string) => driverData?.find((d) => d.Abbreviation === code)?.TeamColor ?? "#999";
    
    const fastestLapByDriver = driverCode.map((code) => ({
       code,
       color: colorFor(code),
       time: Math.min(...results[code].points.map((p) => p.lap_time)), 
    })).sort((a, b) => a.time - b.time);

    const MIN_STINT_LAPS = 5;

    const avgLapTime = driverCode.map((code) => {
        const times = results[code].points.map((p) => p.lap_time);
        return { code, color: colorFor(code),
            time: times.length ? times.reduce((a, b) => a+b, 0) / times.length : null 
        };
    });

    const degradationByDriver = driverCode.map((code) => {
        const { slope, points } = results[code];
        const cleanLaps = new Map<number, number>();
        points.forEach((p) => cleanLaps.set(p.stint, (cleanLaps.get(p.stint) ?? 0) + 1));
        let num = 0, den = 0;
        Object.entries(slope).forEach(([stint, s]) => {
            const n = cleanLaps.get(Number(stint)) ?? 0;
            if (n >= MIN_STINT_LAPS) {num += s * n; den += n; } 
        });
        return { code, color: colorFor(code), slope: den ? num / den : null };
    });

    return (
        <div className="main">
            <div className="stat-row">
                    <div className="stat-card">
                        <span className="stat-card__label"><MoveDownRight size="18px"/> Degradation Coeff.</span>
                        {degradationByDriver.map(({ code, color, slope}) => (
                            <div key={code} className="stat-card__row">
                            <span className="stat-card__dot" style={{ background: color, width: "6px", height: "6px", margin: "4px" }}></span>
                            <span className="stat_card__compound" style={{ marginRight: "4px" }}>{code}</span>
                            <span className="stat_card__value">
                                {slope === null ? "n/a" : `${slope >= 0 ? "+" : ""}${slope.toFixed(3)} s/lap`}
                            </span>
                            </div>
                            ))};
                    </div> 
                    <div className="stat-card">
                        <span className="stat-card__label"><CirclePause size="18px"/> Number of stints</span>
                        {driverCode.map((code) => (
                            <div key={code} className="stat-card__row" style={{ alignItems: "center", flexWrap: "wrap" }}>
                                <span className="stat-card__dot" style={{ background: colorFor(code), width: "6px", height: "6px", margin: "4px" }} />
                                <span className="stat-card__compound"  style={{ marginRight: "4px"}} >{code}</span>
                                <span className="stat-card__value" style={{ marginRight: "8px" }}>{results[code].stints.length}</span>
                                {results[code].stints.map((s) => (
                                    <span key={s.stints} style={{ color: COMPOUND_COLOR[s.compound] ?? "var(--text)", marginRight: "6px" }}>
                                        {s.compound[0]}{s.laps}
                                    </span>
                                ))}
                            </div>
                        ))}
                        </div>
                    <div className="stat-card">
                        <span className="stat-card__label"><Timer size="18px"/> Fastest Lap</span>
                        {fastestLapByDriver.map(({ code, color, time}) => (
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
                        {avgLapTime.map(({ code, color, time }) => (
                            <div key={code} className="stat-card__row">
                                <span className="stat-card__dot" style={{ background: color, width: "6px", height: "6px", margin: "4px"}}></span>
                                <span className="stat-card__compound" style={{ marginRight: "4px"}}>{code}</span>
                                <span className="stat-card__value">{time === null ? "n/a" : formatLapTime(time)}</span>
                            </div>
                        ))}
                    </div>


            </div>

            <div className="toggle-group">
                <button className={`toggle-btn ${viewMode === "Tyre Deg" ? "toggle-btn--active" : ""}`} onClick={() => setViewMode("Tyre Deg")}>Tyre Degradation</button>
                <button className={`toggle-btn ${viewMode === "Lap Time" ? "toggle-btn--active" : ""}`} onClick={() => setViewMode("Lap Time")}>Lap Time</button>
                <button className={`toggle-btn ${viewMode === "Gap" ? "toggle-btn--active" : ""}`} onClick={() => setViewMode("Gap")}>Gap</button>
                <button className={`toggle-btn ${viewMode === "History" ? "toggle-btn--active" : ""}`} onClick={() => setViewMode("History")}>History</button>
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
                                formatter={(value) => formatLapTime(Number(value))}/>
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
                                    labelFormatter={(value) => `Lap : ${value}`}
                                    formatter={(value) => `Time : ${formatLapTime(Number(value))}`} />
                                    <Legend 
                                    wrapperStyle={customLegend}
                                    onMouseEnter={(o) => setActiveKey(o.value as string)}
                                    onMouseLeave={() => setActiveKey(null)}/>
                                    {driverCode.map((code) => (
                                        <Line key={code} type="monotone" dataKey={code} name={code} dot={false} stroke={colorFor(code)} connectNulls strokeWidth={2} strokeOpacity={activeKey === null || activeKey === code ? 1 : 0.15} />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                    </div>
                ) : viewMode === "History" ? (
                    <div className="chart-card">
                        {/* <h2 className="chart-card__title">Laps</h2> */}
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart data={mergedPositions}>
                                    <CartesianGrid stroke="var(--line)"/>
                                    <XAxis dataKey="LapNumber" name="Lap Number" style={{ fontSize: "11px" }}/>
                                    <YAxis reversed domain={[1, 20]} allowDecimals={false} style={{ fontSize: "11px" }}/>
                                    <Tooltip
                                    contentStyle={{
                                        background: "var(--bg-panel)",
                                        border: "1px solid var(--line)",
                                        borderRadius: "var(--radius)",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "11px",
                                    }}
                                    labelStyle={{ color: "var(--fastest-accent)" }}
                                    labelFormatter={(value) => `P${value}`} />
                                    <Legend 
                                    wrapperStyle={customLegend}
                                    onMouseEnter={(o) => setActiveKey(o.value as string)}
                                    onMouseLeave={() => setActiveKey(null)}/>
                                    {driverCode.map((code) => (
                                        <Line key={code} type="monotone" dataKey={code} name={code} dot={false} stroke={colorFor(code)} connectNulls strokeWidth={2} strokeOpacity={activeKey === null || activeKey === code ? 1 : 0.15} />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                    </div>

                ) : (
                    <div className="chart-card">
                        {!gap || gap.rows.length === 0 ? (
                            <p>Select at least two drivers to see the gap</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart data={gap.rows}>
                                <XAxis dataKey="LapNumber" />
                                <YAxis tickFormatter={(v) => `${v > 0 ? "+" : ""}${Number(v).toFixed(1)}s`} style={{ fontSize: "11px"}}/>
                                <ReferenceLine y={0} stroke={colorFor(gap.reference)} label={gap.reference} />
                                <Tooltip
                                    contentStyle={{
                                        background: "var(--bg-panel)",
                                        border: "1px solid var(--line)",
                                        borderRadius: "var(--radius)",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "11px",
                                    }}
                                    labelFormatter={(v) => `${Number(v) > 0 ? "+" : ""}${Number(v).toFixed(3)}s`}></Tooltip>
                                <Legend wrapperStyle={customLegend}
                                    onMouseEnter={(o) => setActiveKey(o.value as string)}
                                    onMouseLeave={() => setActiveKey(null)}/>
                                {drivers.filter((c) => c !== gap.reference).map((code) => (
                                    <Line key={code} type="monotone" dataKey={code} name={code} stroke={colorFor(code)} dot={false} strokeWidth={2} connectNulls={false} />)
                                )}
                                {/* {Object.keys(gap.rows[0]).filter(k => k !== "LapNumber").map(code => */}
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

