from app.services.f1_data import load_cached_session, clean_data, fuel_correction, fit_regression, extract_telemetry, extract_drivers_info, extract_weather, extract_session, extract_race_results, calculate_boxplot_by_compound
from pydantic import BaseModel
import pandas as pd

class DegradationPoint(BaseModel):
    tyre_life: int
    lap_time: float
    lap_number: int
    corrected_lap_time: float
    compound: str
    stint: int


class TelemetryPoint(BaseModel):
    Distance: float
    Speed: float
    Throttle: float
    nGear: float
    RPM: float
    X: float
    Y: float

class RaceResults(BaseModel):
    DriverNumber: str
    Abbreviation: str
    FullName: str
    Position: float
    GridPosition: float
    Points: float

class WeatherInfo(BaseModel):
    Time: float
    AirTemp: float
    TrackTemp: float

class SessionInfo(BaseModel):
    Name: str
    OfficialName: str
    Location: str


class SessionData(BaseModel):
    Weather: list[WeatherInfo]
    Info: dict[str, str]
    Results: list[RaceResults]


class BoxplotStats(BaseModel):
    whislo: float
    q1: float
    med: float
    q3: float
    whishi: float
    fliers: list[float]


class DriverPoint(BaseModel):
    DriverNumber: str
    Abbreviation: str
    TeamColor: str
    TeamName: str


class DegradationResult(BaseModel):
    driver: str
    points: list[DegradationPoint]
    slope: dict[int, float]
    intercept: dict[int, float]
    telemetry: list[TelemetryPoint]
    distribution: dict[str, BoxplotStats]



def compute_tyre_deg(session_year: int, session_round: int, driver: str) -> DegradationResult:
    session = load_cached_session(session_year, session_round)
    laps = clean_data(session, driver)
    TelemetryData = extract_telemetry(laps, driver)
    laps = fuel_correction(laps)
    intercepts, slopes = fit_regression(laps)
    distribution = calculate_boxplot_by_compound(laps)

    return DegradationResult(
        driver=driver,
        points=[DegradationPoint(
            tyre_life=row.TyreLife,
            lap_time=row.LapTimeSeconds,
            lap_number=row.LapNumber,
            corrected_lap_time=row.CorrectedLapTime,
            compound=row.Compound,
            # compound_color=row.CompoundColor,
            stint=row.Stint
        ) for _, row in laps.iterrows()],
        slope=slopes,
        intercept=intercepts,
        telemetry=TelemetryData,
        distribution=distribution
    )


def compute_tyre_deg_multi(session_year: int, session_round: int, drivers: list[str]) -> dict[str, DegradationResult]:
    session = load_cached_session(session_year, session_round)
    results = {}
    for driver in drivers:
        laps = clean_data(session, driver)
        TelemetryData = extract_telemetry(laps, driver)
        laps = fuel_correction(laps)
        intercepts, slopes = fit_regression(laps)
        distribution = calculate_boxplot_by_compound(laps)
        results[driver] = DegradationResult(
            driver=driver,
            points=[DegradationPoint(
                tyre_life=row.TyreLife,
                lap_time=row.LapTimeSeconds,
                lap_number=row.LapNumber,
                corrected_lap_time=row.CorrectedLapTime,
                compound=row.Compound,
                stint=row.Stint
            ) for _, row in laps.iterrows()],
            slope=slopes,
            intercept=intercepts,
            telemetry=TelemetryData,
            distribution=distribution
        )

    return results


def compute_driver_data(session_year: int, session_round: int) -> list[DriverPoint]:
    session = load_cached_session(session_year, session_round)
    driver_data = extract_drivers_info(session)
    return [DriverPoint(
        DriverNumber=row.DriverNumber,
        Abbreviation=row.Abbreviation,
        TeamColor=row.TeamColor,
        TeamName=row.TeamName
    ) for _, row in driver_data.iterrows()]


def compute_session_data(session_year: int, session_round: int) -> SessionData:
    session = load_cached_session(session_year, session_round)
    weather = extract_weather(session)
    session_info = extract_session(session)
    results = extract_race_results(session)
    return SessionData(
        Weather=weather,
        Info=session_info,
        Results=results
    )
