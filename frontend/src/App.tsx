import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SidebarDriver, SidebarRace } from "./components/SideBar";
import { TyreDegradationChart } from "./components/TyreDegradationCharts";
import { TelemetryChart } from "./components/TelemetryCharts";
import type { SessionInfo, DriverPoint, DegradationResult, CachedRaces } from "./types/f1";
import { getCachedRaces, getDriverPoint, getSessionData, getTyreDegradation } from "./api/client";
import { RightSideBar } from "./components/RightSideBar";
import { TopBar } from "./components/TopBar";
import { DriverMultiSelect } from "./components/DriverMultiSelect";

function App() {

    const [collapsed, setCollapsed] = useState(true);
    const [rightCollapsed, setRightCollapsed] = useState(true);
    const [mode, setMode] = useState<"single" | "compare">("single");
    const [compareDriver, setCompareDriver] = useState<string[]>(["HAM","VER"])
    const [year, setYear] = useState(2026);
    const [round, setRound] = useState(2);
    const [driver, setDriver] = useState("HAM");
    const [data, setData] = useState<DegradationResult | null>(null);
    const [driverData, setDriverData] = useState<DriverPoint[] | null>(null);
    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
    const [races, setRaces] = useState<CachedRaces | null>(null); 
    // const [data, setData] = useState<DegradationResult | null>(null);

    
        useEffect(() => {
            let cancelled = false;
            setData(null);
            getTyreDegradation(year, round, driver).then((d) => { if (!cancelled) setData(d); });
            return () => { cancelled = true; }; 
        }, [year, round, driver]);
        
        useEffect(() => {
            getDriverPoint(year, round).then(setDriverData);
        }, [year, round]);

        useEffect(() => {
            let cancelled = false;
            setSessionInfo(null);
            getSessionData(year, round).then((d) => { if (!cancelled) setSessionInfo(d); });
            return () => { cancelled = true; };
        }, [year, round]);

        useEffect(() => {
            getCachedRaces().then(setRaces);
        }, []);

        function handleYearChange(y: number) {
            setYear(y);
            const first = races?.[String(y)]?.[0];
            if (first) setRound(first.round);
        }

    return (
        <div 
        className="layout"
        style={{ 
            ["--sidebar-width" as string]: collapsed ? "50px" : "260px",
            ["--rightsidebar-width" as string]: rightCollapsed ? "50px" : "260px"
         }}
        >

            <TopBar 
            onToggleSidebar={() => setCollapsed((c) => !c)}
            onToggleRightbar={() => setRightCollapsed((c) => !c)}
            />
            {(!collapsed || !rightCollapsed) && (
                <div className="mobile-backdrop" onClick={() => { setCollapsed(false); setRightCollapsed(false); }} />
            )}

            <div className={`sidebar ${!collapsed ? "mobile-open" : ""}`}>
                <button 
                className="sidebar__toggle"
                style={{ textAlign: "right" }} 
                onClick={() => setCollapsed((c) => !c)}>
                {collapsed ? <ChevronRight /> : <ChevronLeft />}
                </button>
                {!collapsed && (
                    <>
                        <SidebarRace races={races} year={year} round={round} onYearChange={handleYearChange} onRoundChange={setRound}/>
                        <div className="toggle-group">
                            <button className={`toggle-btn ${mode === "single" ? "toggle-btn--active" : ""}`} onClick={() => setMode("single")}>Single</button>
                            <button className={`toggle-btn ${mode === "compare" ? "toggle-btn--active" : ""}`} onClick={() => setMode("compare")}>Compare</button>
                        </div>
                        {mode === "single" ? (
                            <SidebarDriver driverData={driverData} selectedDriver={driver} onSelectDriver={setDriver}/>
                        ) : (
                            <DriverMultiSelect driverData={driverData} selected={compareDriver} onChange={setCompareDriver} />
                        )}
                    </>
                )}
            </div>
            <div className="main">
                <h1 className="main-title">Driver selected: {driver}</h1>
                <div className="chart-container">
                    <TyreDegradationChart year={year} round={round} driver={driver} driverData={driverData} mode={mode} compareDrivers={compareDriver} />
                </div>
                <div className="chart-container">
                    <TelemetryChart year={year} round={round} driver={driver} driverData={driverData} mode={mode} compareDrivers={compareDriver} />
                </div>
            </div>
            <div className={`rightbar ${!rightCollapsed ? "mobile-open" : ""}`}>
                <button 
                className="rightbar-toggle"
                style={{ textAlign: "left" }} 
                onClick={() => setRightCollapsed((c) => !c)}>
                {rightCollapsed ? <ChevronLeft/> : <ChevronRight/>}
                </button>
                {!rightCollapsed && (
                    <>
                        <RightSideBar sessionInfo={sessionInfo} data={data} />
                    </>
                )}
            </div>
        </div>
    );
}

export default App;