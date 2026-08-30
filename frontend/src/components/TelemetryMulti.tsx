import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ResponsiveContainer } from 'recharts'
import { useEffect, useState, type CSSProperties } from 'react'
import type { DegradationResult, DriverPoint } from '../types/f1';
import { getTyreDegradationMulti } from '../api/client';


const customLegend: CSSProperties = {
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    padding: '4px',
}


type ViewMode = 'Speed' | 'Gear' | 'Throttle' | 'RPM'

const VIEW_CONFIG: Record<ViewMode, {dataKey: string; name: string; formatter: (v: number) => string}> = {
    Speed: { dataKey: "Speed", name: "Speed", formatter: (v) => `${v.toFixed(1)} km/h` },
    Gear: { dataKey: "nGear", name: "Gear", formatter: (v) => `${Math.round(v)}`},
    Throttle: { dataKey: "Throttle", name: "Throttle", formatter: (v) => `${v.toFixed(2)}`},
    RPM: { dataKey: "RPM", name: 'RPM', formatter: (v) => `${v}`},
}

export function TelemetryChartMulti({ year, round, drivers, driverData}:{ year: number; round: number; drivers: string[]; driverData: DriverPoint[] | null; }) {
    const [viewMode, setViewMode] = useState<ViewMode>('Speed');
    const [results, setResults] = useState<Record<string, DegradationResult> | null>(null);
    const [loading, setLoading] = useState(true)
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const colorFor = (code: string) => driverData?.find((d) => d.Abbreviation === code)?.TeamColor ?? '#999';

    useEffect(() => {
        setLoading(true);
        getTyreDegradationMulti(year, round, drivers).then(setResults).finally(() => setLoading(false));
    }, [year, round, drivers]);

    if (loading) return <p>Loading...</p>
    if (!results) return <p>No data</p>

    const config = VIEW_CONFIG[viewMode];

    return (
        <div>
            <h2 className='chart-card__title'>Telemetry</h2>
            <div className="toggle-group">
                {(Object.keys(VIEW_CONFIG) as ViewMode[]).map((mode) => (
                    <button
                    key={mode}
                    className={`toggle-btn ${mode === viewMode ? "toggle-btn--active":""}`}
                    onClick={() => setViewMode(mode)}
                    >
                        {VIEW_CONFIG[mode].name}
                    </button>
                ))}
            </div>
            <div className='chart-card'>
                <ResponsiveContainer width="100%" height={320} style={{ margin: "6px" }}>
                    <LineChart>
                        <CartesianGrid stroke='var(--line)' />
                        <XAxis type="number" dataKey="Distance" tick={{ fill: "var(--text-muted)" }} tickFormatter={(value: number) => (Math.round(value * 100)/100).toFixed(2)} domain={["dataMin","dataMax"]} fontSize={11}/>
                        <YAxis type="number" dataKey={config.dataKey} domain={["dataMin","dataMax"]} fontSize={11}/>
                        <Tooltip 
                         contentStyle={{
                                    background: "var(--bg-panel)",
                                    border: "1px solid var(--line)",
                                    borderRadius: "var(--radius)",
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "9px",
                         }}
                        labelStyle={{ color: "var(--text-muted)"}}   
                        formatter={(value) => config.formatter(Number(value))}
                        />
                        <Legend 
                        wrapperStyle={customLegend}
                        onMouseEnter={(o) => setActiveKey(o.value as string)}
                        onMouseLeave={() => setActiveKey(null)}/>
                        {drivers
                        .filter((code) => results[code])
                        .map((code) => (
                            <Line
                                key={code}
                                data={results[code].telemetry}
                                type="monotone"
                                dataKey={config.dataKey}
                                name={code}
                                stroke={colorFor(code)}
                                dot={false}
                                isAnimationActive={false}
                                strokeWidth={3}
                                strokeOpacity={activeKey === null || activeKey === code ? 1 : 0.15}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )

}