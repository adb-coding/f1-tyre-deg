import type { DriverPoint } from "../types/f1";

interface DriverMultiSelectProps {
    driverData: DriverPoint[] | null;
    selected: string[];
    onChange: (drivers: string[]) => void;
}

export function DriverMultiSelect({ driverData, selected, onChange}: DriverMultiSelectProps) {
    function toggle(code: string) {
        if (selected.includes(code)) {
            onChange(selected.filter((d) => d !== code));
        } else {
            onChange([...selected, code]);
        }
    }

    return (
        <div className="sidebar">
            <div className="sidebar__title">Compare Drivers</div>
            {driverData?.map((d) => (
                <label key={d.Abbreviation} className="driver-row driver-row--checkbox" style={{ borderLeft: `4px solid ${d.TeamColor}`}}>
                    <input type="checkbox" checked={selected.includes(d.Abbreviation)} onChange={() => toggle(d.Abbreviation)} />
                    {d.Abbreviation}
                </label>
            ))}
        </div>
    );
}