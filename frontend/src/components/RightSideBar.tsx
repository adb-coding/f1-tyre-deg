import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, LineChart, Line } from 'recharts';
import type { DegradationResult, SessionInfo } from '../types/f1.ts';

interface RightSideBarProps{
    sessionInfo: SessionInfo | null;
    data: DegradationResult | null;
    // weatherData: WeatherInfo[] | null;
}

export function RightSideBar({ sessionInfo, data }:RightSideBarProps){
    if (!sessionInfo) return <div className="rightbar">Loading...</div>;

    const avgAirTemp = sessionInfo.Weather.reduce((sum, p) => sum + p.AirTemp, 0) / sessionInfo.Weather.length;
    const avgTrackTemp = sessionInfo.Weather.reduce((sum, p) => sum + p.TrackTemp, 0) / sessionInfo.Weather.length;

    return (
        <div className="right-sidebar">
            <div>
                <div className='rightbar-title'>Race Info</div>
                {Object.entries(sessionInfo.Info).map(([key, value]) => (
                    <div key={key} className='info-row'>
                        <span className="info-row__label">{key}</span>
                        <span className="info-row__value">{value}</span>
                    </div>
                ))}
            </div>
                <div className='rightbar-title'>Weather Data</div>
                <div className="info-row">
                    <span className="info-row__label">Air Temp</span>
                    <span className="info-row__value">{avgAirTemp.toFixed(1)}°</span>
                    <span className="info-row__label">Track Temp</span>
                    <span className="info-row__value">{avgTrackTemp.toFixed(1)}°</span>
                </div>
                <div className='rightbar-title'>Track</div>
                    <div className='chart-card'>
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={data?.telemetry}>
                                <CartesianGrid stroke="none" />
                                <XAxis type="number" dataKey="X" name="X" domain={["dataMin - 100","dataMax + 100"]} hide />
                                <YAxis type="number" dataKey="Y" name="Y" domain={["dataMin - 100","dataMax + 100"]} hide />
                                <Line type="linear" dataKey="Y" strokeWidth={3} stroke="var(--text-muted)" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                </div>
                <div className='rightbar-title'>Race Results</div>
                {sessionInfo.Results.slice(0,10).map((r) => (
                    <div key={r.DriverNumber} className='result-row'>
                        <span className="result-row__pos">{r.Position}</span>
                        <span className="result-row__driver">{r.Abbreviation}</span>
                        <span className='result-row_driver'>{r.FullName}</span>
                        <span className="result-row__points">{r.Points}</span>
                    </div>
                ))}
        </div>
    )
}