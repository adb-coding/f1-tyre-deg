import os
import fastf1
import pandas as pd
import numpy as np
from matplotlib.cbook import boxplot_stats
from functools import lru_cache
from sklearn.linear_model import LinearRegression
from pydantic import BaseModel
from fastf1.exceptions import DataNotLoadedError

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

compound_color = {
    'SOFT':'red',
    'MEDIUM':'yellow',
    'HARD':'grey',
    'INTERMEDIATE':'green',
    'WET':'blue'
}

class SessionDataUnavailable(RuntimeError):
    """fastf1 could not load the session (no cache and download failed)."""


def _has_data(path):
    # a race folder counts as cached only if it really contains files
    return any(files for _, _, files in os.walk(path))


class CachedRaces(BaseModel):
    cached_races: dict[str, list]


@lru_cache(maxsize=3)
def load_cached_session(year, gp):
    # Load the sesison data from fastf1 API
    session_data = fastf1.get_session(year=year, gp=gp, identifier='RACE')
    session_data.load()

    # fastf1 does not raise when a download fails: it only logs "Failed to load ..."
    # and the error shows up later as DataNotLoadedError. Check it here instead.
    try:
        session_data.laps
    except DataNotLoadedError as e:
        raise SessionDataUnavailable(
            f"Race data for {year} round {gp} is not available (not in cache and the download failed)"
        ) from e

    return session_data
    

def get_races_cached():
    # extract the number of races cached in the folder
    years = os.listdir(CACHE_DIR)
    rounds_per_year = {}
    for year in years: 
        CACHE_DIR_YEAR = os.path.join(CACHE_DIR, str(year))
        if os.path.isdir(CACHE_DIR_YEAR):
            races = [r for r in os.listdir(CACHE_DIR_YEAR)
                     if _has_data(os.path.join(CACHE_DIR_YEAR, r))]
            rounds_per_year.update({year : races})

    years = list(rounds_per_year.keys())

    # get the round number for each race cached

    gp_round_dict = {}
    for year in rounds_per_year.keys(): 
        race_list = []
        race_calendar = fastf1.get_event_schedule(int(year))[['EventDate','RoundNumber']]
        for race in rounds_per_year.get(year):
            date = race.split('_')[0]
            name = race.split('_')[1:]
            name = " ".join(name)
            round_number = int(race_calendar.loc[race_calendar['EventDate'] == date]['RoundNumber'].reset_index(drop=True).iloc[0])
            race_list.append({'round':round_number, 'name':name, 'date':date})

        race_list.sort(key=lambda r: r['round'])
        gp_round_dict.update({year : race_list})
        
    # years in ascending order too (listdir order is arbitrary)
    return dict(sorted(gp_round_dict.items()))


def clean_data(session, driver):
    # Remove laps that include pit-stops and SC/VSC or yellow flag 
    laps = session.laps
    laps['LapTimeSeconds'] = laps['LapTime'].dt.total_seconds()
    # Remove the box laps and the laps with SC or VSC
    clean_laps = laps.pick_drivers(driver).pick_wo_box().pick_track_status("24567", how="none").reset_index().iloc[1:,].reset_index()

    return clean_laps


def extract_telemetry(laps, driver):
    # Extract the telemetry of the fastest lap of the selected driver
    try:
        telemetry_data = laps.pick_drivers(driver).pick_fastest().get_telemetry()
    except Exception:
        return []
    return telemetry_data[["Distance","Speed","Throttle","nGear","RPM","X","Y"]].to_dict(orient="records")


def extract_turns_position(session):
    # Extract the turn position
    try:
        turns = session.get_circuit_info().corners.Distance
        # turns_number = []
        # for i in turns.index:
        #     turns_number.append(i + 1)

        # turns_dict = dict(zip(turns_number, turns))
    except Exception:
        return {}
    return dict(zip([i + 1 for i in turns.index], turns))


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

    for stint, group in laps.groupby('Stint'):
        group = group.dropna(subset=['TyreLife','CorrectedLapTime'])

        if len(group) < 2:
            continue
    
        reg = LinearRegression().fit(group[['TyreLife']].to_numpy(dtype=float),
                                     group['CorrectedLapTime'].to_numpy(dtype=float))
        intercepts[int(stint)] = float(reg.intercept_)
        slope[int(stint)] = float(reg.coef_[0])

    return intercepts, slope 
    

def get_position(session, driver):
    laps = session.laps.pick_drivers(driver)[['LapNumber','Position']].dropna()
    # laps['Time'] = laps['Time'].dt.total_seconds()
    # laps['LapTime'] = laps['Time'].dt.total_seconds()
    laps = laps.astype(int).to_dict('records')
    
    return laps


def calculate_drivers_gap(session, drivers):
    laps = session.laps
    laps = laps[laps['Driver'].isin(drivers)]

    times = laps.assign(Seconds=laps['Time'].dt.total_seconds()).pivot(index='LapNumber', columns='Driver', values='Seconds')
    times = times.dropna(axis=1, how='all')

    res = session.results
    res = res[res['Abbreviation'].isin(times.columns)]
    reference = res.sort_values(by='Position').iloc[0]['Abbreviation']

    gap = times.sub(times[reference], axis=0).drop(columns=reference)
    gap = gap.dropna(how="all")
    gap.index = gap.index.astype(int)

    rows = gap.reset_index().replace({np.nan : None}).to_dict('records')
    
    return {"reference": reference, "rows": rows}


def get_stints(session, driver):
    laps = session.laps.pick_drivers(driver).dropna(subset=['Stint'])
    stints = (laps.groupby('Stint')
              .agg(compound=('Compound','first'),
                start_lap=('LapNumber','min'),
                end_lap=('LapNumber', 'max'),
                laps=('LapNumber', 'count')).reset_index())
    stints['Stint'] =  stints['Stint'].astype(int)
    stints['compound'] = stints['compound'].fillna('UNKNOWN')
    stints[['start_lap','end_lap']] = stints[['start_lap','end_lap']].astype(int)
    
    return stints.rename(columns={'Stint':'stint'}).to_dict('records')