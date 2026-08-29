import type { DriverPoint } from "../types/f1";


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
    onYearChange: (year: number) => void;
    onRoundChange: (round: number) => void;
}

export function SidebarRace({ year, round, onYearChange, onRoundChange }: SideBarRace) {
    return (
        <div className="sidebar__section">
            <div className="sidebar__title">Select Race</div>
            <div className="field-group">
                <span style={{ fontFamily: "var(--font-display)" }}>
                    {/* Select Round */}
                </span>
                    <label htmlFor="year-select">Anno</label>
                        <select id="year-select" value={year} onChange={(e) => onYearChange(Number(e.target.value))}>
                            <option value={2024}>2024</option>
                            <option value={2025}>2025</option>
                            <option value={2026}>2026</option>
                        </select>
                    <label htmlFor="round-input">Round</label>
                        <input id="round-input" 
                        type="number"
                        min={1}
                        max={24}
                        value={round}
                        onChange={(e) => onRoundChange(Number(e.target.value))}
                        />
            </div>
        </div>
    )
}