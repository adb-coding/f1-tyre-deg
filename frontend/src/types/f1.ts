export interface DegradationPoint{
    tyre_life: number;
    lap_time: number;
    lap_number: number;
    corrected_lap_time: number;
    compound: string;
    stint: number;
}

export interface TelemetryPoint{
    Distance: number;
    Speed: number;
    Throttle: number;
    nGear: number;
    RPM: number;
    X: number;
    Y: number;
}

export interface WeatherInfo{
    Time: number;
    AirTemp: number;
    TrackTemp: number;
}

export interface RaceResults{
    DriverNumber: string;
    Abbreviation: string;
    FullName: string;
    Position: number;
    GridPosition: number;
    Points: number;    
}

export interface SessionInfo{
    Weather: WeatherInfo[];
    Info: Record<string, string>;
    Results: RaceResults[];
}


export interface DriverPoint{
    DriverNumber: string;
    Abbreviation: string;
    TeamColor: string;
    TeamName: string;
}

export interface BoxplotStats{
    whislo: number;
    q1: number;
    med: number;
    q3: number;
    whishi: number;
    fliers: number[];
}

export interface DegradationResult{
    driver: string;
    points: DegradationPoint[];
    slope: Record<number, number>;
    intercept: Record<number, number>;
    telemetry: TelemetryPoint[];
    distribution: Record<string, BoxplotStats>;
}
