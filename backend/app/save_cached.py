import fastf1
from fastf1.ergast import Ergast
import argparse
import datetime as dt
import os

CACHE_DIR = r"C:\Coding\portfolio-projects\tyre-deg\backend\cache"
fastf1.Cache.enable_cache('./backend/cache')

ergast = Ergast()


parser = argparse.ArgumentParser()
parser.add_argument("season", type=int, help="Set the season to download")
parser.add_argument("--round", help="Set the round to download")
args = parser.parse_args()
season = args.season

if args.round:
    round = args.round
    race_data = fastf1.get_session(season, round)
    race_data.load()

else:
    race_schedule = ergast.get_race_schedule(season)

    for idx, col in race_schedule.iterrows():
        if col['raceDate'] < dt.datetime.today():
            round_race = idx + 1
            print("Season: ", season, " round: ", round_race, " circuit: ", col['circuitName'])
            try:
                race_data = fastf1.get_session(season, round_race, "RACE")
                race_data.load()
                
            except TypeError as e:
                print(f"Not able to retrieve round {round_race}")
