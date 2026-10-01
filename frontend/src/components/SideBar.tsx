import type { DriverPoint, CachedRaces } from "../types/f1";



interface SidebarDriverProps {
    driverData: DriverPoint[] | null;
    selectedDriver: string;
    onSelectDriver: (driver: string) => void;
}


export function SidebarDriver({ driverData, selectedDriver, onSelectDriver }: SidebarDriverProps){

    
    return (
        <div className="sidebar__section">
            <div className="sidebar__title">Select Driver</div>
            {driverData?.map((d) => (
                <button
                key={d.Abbreviation}
                className={`driver-row ${d.Abbreviation === selectedDriver ? "driver-row--selected" : ""}`}
                style={{ borderLeft: `4px solid ${d.TeamColor}` }}
                onClick={() => onSelectDriver(d.Abbreviation)}
                >
                {d.Abbreviation}
                </button>
            ))}
        </div>
    );
}


interface SideBarRace {
    year: number;
    round: number;
    races: CachedRaces | null;
    onYearChange: (year: number) => void;
    onRoundChange: (round: number) => void;
}

export function SidebarRace({ year, round, races, onYearChange, onRoundChange }: SideBarRace) {
    if (!races) return <div className="sidebar__section">Loading...</div>
    return (
        <div className="sidebar__section">
            <div className="sidebar__title">Select Race</div>
            <div className="field-group">
                <span style={{ fontFamily: "var(--font-display)" }}>
                    {/* Select Round */}
                </span>
                    <label htmlFor="year-select">Year</label>
                        <select id="year-select" value={year} onChange={(e) => onYearChange(Number(e.target.value))}>
                            {Object.keys(races).map((y) => 
                            <option key={y} value={y}>{y}</option>)}
                        </select>
                    <label htmlFor="round-input">Round</label>
                        <select  id="round-input" value={round}
                        onChange={(e) => onRoundChange(Number(e.target.value))}>
                        {races[String(year)]?.map((r) => (
                            <option key={r.round} value={r.round}>{r.name}</option>
                        ))}
                        </select>
            </div>
        </div>
    )
}