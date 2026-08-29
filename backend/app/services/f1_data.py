import fastf1
import pandas as pd
import numpy as np
from matplotlib.cbook import boxplot_stats
from functools import lru_cache
from sklearn.linear_model import LinearRegression

fastf1.Cache.enable_cache('./cache')

compound_color = {
    'SOFT':'red',
    'MEDIUM':'yellow',
    'HARD':'grey',
    'INTERMEDIATE':'green',
    'WET':'blue'
}

@lru_cache(maxsize=16)
def load_cached_session(year, gp):
    # Load the sesison data from fastf1 API
    session_data = fastf1.get_session(year=year, gp=gp, identifier='RACE')
    session_data.load()

    return session_data
    

def clean_data(session, driver):
    # Remove laps that include pit-stops and SC/VSC or yellow flag 
    laps = session.laps
    laps['LapTimeSeconds'] = laps['LapTime'].dt.total_seconds()
    # Remove the box laps and the laps with SC or VSC
    clean_laps = laps.pick_driver(driver).pick_wo_box().pick_track_status("6", how="excludes").pick_track_status("4", how="excludes").reset_index().iloc[1:,].reset_index()

    return clean_laps


def extract_telemetry(laps, driver):
    # Extract the telemetry of the fastest lap of the selected driver
    telemetry_data = laps.pick_drivers(driver).pick_fastest().get_telemetry()
    telemetry_data = (
        telemetry_data[["Distance","Speed","Throttle","nGear","RPM","X","Y"]].to_dict(orient="records")
        )
    return telemetry_data


def extract_drivers_info(session):
    # Retrieve the drivers info to display their color
    drivers = pd.DataFrame()

    for i in range(len(session.drivers)):
        drivers[i] = session.get_driver(session.drivers[i])[['DriverNumber','Abbreviation','TeamColor','TeamName']]

    drivers = drivers.T
    drivers['TeamColor'] = '#' + drivers['TeamColor']

    return drivers


def extract_weather(session):
    # Extract the weather data throughout the race
    weather_data = session.weather_data
    weather_data = weather_data[['Time','AirTemp','TrackTemp']]
    weather_data['Time'] = weather_data['Time'].dt.total_seconds()
    weather_data = weather_data.to_dict(orient="records")
    return weather_data


def extract_session(session):
    # Extract the session info
    info = session.session_info.get("Meeting")
    info_df = {}
    session_keys = ['Name','OfficialName','Location']

    for i in range(len(info.keys())):
        
        if list(info.keys())[i] in session_keys:
            info_df[list(info.keys())[i]] = info.get(list(info.keys())[i])

    return info_df


def extract_race_results(session):
    # Extract the race result with the final position
    race_results = session.results[['DriverNumber','Abbreviation','FullName','Position','GridPosition','Points']]
    race_results = race_results.to_dict(orient="records")
    return race_results


def calculate_boxplot(lap_times: pd.Series) -> dict:
    # values = dict()
    bp = boxplot_stats(lap_times.dropna())[0]
    return {
        "whislo": float(bp['whislo']),
        "q1": float(bp['q1']),
        "med": float(bp['med']),
        "q3": float(bp['q3']),
        "whishi": float(bp['whishi']),
        "fliers": [float(v) for v in bp['fliers']]
    }

def calculate_boxplot_by_compound(laps):
    result = {}
    for compound, group in laps.groupby("Compound"):
        result[compound] = calculate_boxplot(group["LapTimeSeconds"])

    return result
    

def fuel_correction(laps):
    # Correct the lap times based on the lighter car
    # Total race number
    total_laps = int(laps.LapNumber.max())
    full_tank = 110
    # Fuel consumption per lap - assuming 1kg of fuel remained in the tank
    fcpl = (full_tank - 1)/total_laps

    for i in range(len(laps)):
        if pd.isnull(laps['LapTime'][i]):
            laps.drop(index=i, inplace=True)

    time_effect = np.zeros(shape=(total_laps, 1), dtype=np.float64)

    for i in range(1, len(laps)):
        fuel_load = full_tank - fcpl * laps['LapNumber'].iloc[i]
        lap_time = laps['LapTime'].iloc[i]

        previous_lap = laps['LapTime'].iloc[i - 1] 
        previous_fuel_lap = full_tank - fcpl * laps['LapNumber'].iloc[i - 1]

        time_effect[i] = ((previous_lap - lap_time)/(previous_fuel_lap - fuel_load)).total_seconds()

    # Calculate corrected lap time
    fuel_burned = fcpl * laps['LapNumber']
    laps['CorrectedLapTime'] = laps['LapTime'].dt.total_seconds() + fuel_burned * time_effect.mean()


    return laps


def fit_regression(laps):
    # Linear regression model to estimate the slope and intercept of the degradation
    intercepts = dict()
    slope = dict()
    # divide by the number of stints
    n_stint = laps.Stint.nunique()

    for i in range(1, n_stint + 1):
        tyre_life = laps.loc[laps['Stint'] == i]['TyreLife'].values.reshape(len(laps.loc[laps['Stint'] == i].TyreLife), 1)
        corrected_lap_time = laps.loc[laps['Stint'] == i]['CorrectedLapTime'].values.reshape(len(laps.loc[laps['Stint'] == i].CorrectedLapTime), 1)

        reg = LinearRegression().fit(tyre_life, corrected_lap_time)

        intercepts[i] = float(reg.intercept_[0])
        slope[i] = float(reg.coef_[0][0])

    return intercepts, slope 
    


