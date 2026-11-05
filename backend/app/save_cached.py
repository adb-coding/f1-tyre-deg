import fastf1
from fastf1.ergast import Ergast
from fastf1.exceptions import DataNotLoadedError
import argparse
import datetime as dt
import os
import shutil

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'cache')
fastf1.Cache.enable_cache(CACHE_DIR)


def download(season, rnd):
    # fastf1's load() never raises on a failed download, so verify the laps are there
    session = fastf1.get_session(season, rnd, "RACE")
    session.load()
    try:
        session.laps
        return True
    except DataNotLoadedError:
        # remove the empty folder, otherwise it is listed as a cached race
        shutil.rmtree(os.path.join(CACHE_DIR, str(season),
                      f"{session.event['EventDate']:%Y-%m-%d}_{session.event['EventName'].replace(' ', '_')}"),
                      ignore_errors=True)
        return False

ergast = Ergast()


parser = argparse.ArgumentParser()
parser.add_argument("season", type=int, help="Set the season to download")
parser.add_argument("--round", help="Set the round to download")
args = parser.parse_args()
season = args.season

if args.round:
    round = args.round
    if not download(season, int(round)):
        print(f"Download FAILED for season {season} round {round}")

else:
    race_schedule = ergast.get_race_schedule(season)

    for idx, col in race_schedule.iterrows():
        if col['raceDate'] < dt.datetime.today():
            round_race = idx + 1
            print("Season: ", season, " round: ", round_race, " circuit: ", col['circuitName'])
            try:
                if not download(season, round_race):
                    print(f"Download FAILED for round {round_race}")
            except TypeError as e:
                print(f"Not able to retrieve round {round_race}")
