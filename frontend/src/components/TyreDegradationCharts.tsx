// import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, LineChart, ResponsiveContainer, type LegendPayload } from "recharts";
// import { useEffect, useState, type CSSProperties } from "react";
// import { getTyreDegradation, getTyreDegradationMulti } from "../api/client";
import type { DriverPoint } from "../types/f1";
import { TyreDegradationChartSingle } from "./TyreDegradationSingle";
import { TyreDegradationChartMulti } from "./TyreDegradationMulti";


export function TyreDegradationChart({ year, round, driver, driverData, mode, compareDrivers }
    :{ year: number; round: number; driver: string;  driverData: DriverPoint[] | null; mode: "single" | "compare"; compareDrivers: string[]; }) {
    
    if (mode === "single") {
        return <TyreDegradationChartSingle year={year} round={round} driver={driver} driverData={driverData}/>;
    }
        return <TyreDegradationChartMulti year={year} round={round} drivers={compareDrivers} driverData={driverData} />;
}


//     return (
//         <div className="main">
//             <div className="stat-row" style={{ ["--driver-color" as string]: lineColor }}>
//                 <div className="stat-card">
//                     <span className="stat-card__label">Tyre Degradation Coefficient</span>
//                     {degradationByStint.map(({ stint, compound, slope }) => (
//                         <div key={stint} className="stat-card__row">
//                         <span className="stat-card__dot" style={{ background: COMPOUND_COLOR[compound] ?? "#999" }}></span>
//                         <span className="stat_card__compound" style={{ color: COMPOUND_COLOR[compound] ?? "var(--text)" }}>{compound}</span>
//                         <span className="stat_card__value">{(Math.round(slope * 1000) / 1000).toFixed(3)}</span>
//                         </div>
//                     ))}
//                 </div>
//                 <div className="stat-card">
//                     <span className="stat-card__label">Number of stints</span>
//                     <span className="stat-card__big" >{totalStints}</span>
//                     </div>
//                 <div className="stat-card">
//                     <span className="stat-card__label">Fastest Lap</span>
//                     <span className="stat-card__big" style={{ color: "var(--accent-fastest)" }}>{formatLapTime(fastestLap)}</span>
//                     </div>
//                 <div className="stat-card">
//                     <span className="stat-card__label"> Average Lap</span>
//                     <span className="stat-card__big" style={{ color: "var(--accent-pb)" }}>{formatLapTime(avgLapTime)}</span>
//                 </div>

//             </div>
//             {/* <h2 className="chart-card__title">Tyre Analysis</h2> */}
//             <div className="toggle-group" style={{ ["--driver-color" as string]: lineColor }}>
//                     <button className={`toggle-btn ${viewMode === "Lap Time" ? "toggle-btn--active" : ""}`} onClick={() => setViewMode("Lap Time")}>Lap Time</button>
//                     <button className={`toggle-btn ${viewMode === "Distribution" ? "toggle-btn--active" : ""}`} onClick={() => setViewMode("Distribution")}>Distribution</button>
//             </div>
//             <div className="tyre-row">
//                 <div className="chart-card">
//                     {/* <h2 className="chart-card__title">Tyre Degradation</h2> */}
//                     <ResponsiveContainer width="100%" height={320}>
//                         <ScatterChart >
//                             <CartesianGrid stroke="var(--line)"/>
//                             <XAxis dataKey="tyre_life" name="Tyre Life" style={{ fontSize: "11px" }} />
//                             <YAxis dataKey="corrected_lap_time" name="Lap Time" domain={["dataMin - 0.3", "dataMax + 0.3"]} tickFormatter={formatLapTime} style={{ fontSize: "11px" }} />
//                             <Tooltip
//                             contentStyle={{
//                                 background: "var(--bg-panel)",
//                                 border: "1px solid var(--line)",
//                                 borderRadius: "var(--radius)",
//                                 fontFamily: "var(--font-mono)",
//                                 fontSize: "9px",
//                             }}
//                             labelStyle={{ color: "var(--text-muted)"}}   
//                             formatter={(value: number) => formatLapTime(value)}/>
//                             <Legend 
//                             wrapperStyle={customLegend}/>
//                             {compunds.map((compound) => (
//                                 <Scatter 
//                                 key={compound} 
//                                 name={compound} 
//                                 data={data.points.filter((p) => p.compound === compound)}
//                                 fill={COMPOUND_COLOR[compound] ?? "#999"}
//                                 />
//                             ))}
//                         </ScatterChart>
//                     </ResponsiveContainer>
//                 </div>
//                 <div className="chart-card">
//                     {/* <h2 className="chart-card__title">Laps</h2> */}
//                     {viewMode === "Lap Time" ? (
//                         <ResponsiveContainer width="100%" height={320}>
//                             <LineChart data={data.points}>
//                                 <CartesianGrid stroke="var(--line)"/>
//                                 <XAxis dataKey="lap_number" name="Lap Number" style={{ fontSize: "11px" }}/>
//                                 <YAxis dataKey="lap_time" name="Lap Time" tickFormatter={formatLapTime} domain={["dataMin - 1","dataMax + 1"]} style={{ fontSize: "11px" }}/>
//                                 <Tooltip
//                                 contentStyle={{
//                                     background: "var(--bg-panel)",
//                                     border: "1px solid var(--line)",
//                                     borderRadius: "var(--radius)",
//                                     fontFamily: "var(--font-mono)",
//                                     fontSize: "11px",
//                                 }}
//                                 labelStyle={{ color: "var(--fastest-accent)" }}
//                                 labelFormatter={(value: number) => `Lap : ${value}`}
//                                 formatter={(value: number) => `Time : ${formatLapTime(value)}`} />
//                                 {compunds.map((compound) => (
//                                     <Line type="monotone" dataKey="lap_time" dot={false} stroke={COMPOUND_COLOR[compound] ?? "var(--accent-fastest)"} />
//                                 ))}
//                                 <Legend />
//                             </LineChart>
//                         </ResponsiveContainer>

//                     ) : (
                    
//                         <ResponsiveContainer width="100%" height={320}>
                            
//                             <BoxplotChart data={data.distribution} colorMap={COMPOUND_COLOR}></BoxplotChart>
//                         </ResponsiveContainer>

//                     )
//                 }
//                 </div>
//             </div>
//         </div>
//     );
// }
