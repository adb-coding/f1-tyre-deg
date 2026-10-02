---
title: F1 Tyre Degradation API
emoji: 🏎️
colorFrom: red
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
---

# F1 Tyre Degradation API

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://f1-tyre-deg.netlify.app/)
![GitHub License](https://img.shields.io/badge/License-MIT-blue.svg)

This dashboard aims at estimating and analyzing the tyre degradation and the telemetry of the F1 races and present the results in a polished and compelling dashboard. The project focuses on both the backend and frontend.
An interactive version of the dashboard is accessible [here](https://f1-tyre-deg.netlify.app/)

## Stack and Methodology

### Backend Architecture

The backend is responsible for data retrieval, tyre degradation modeling, and API serving.

*   **Data Source:** [FastF1](https://github.com/theOehrly/Fast-F1) for raw race data.
*   **Processing Language:** Python (pandas / scikit-learn for data manipulation and regression).
*   **API Framework:** FastAPI, utilizing Pydantic for data validation and serialization.
*   **Endpoints** live under `/api/...`:
    * `GET /api/tyre-degradation` - degradation, telemetry, corner positions, race positions for one driver 
    * `POST /api/tyre-degradation/multi` - the  same data for several drivers
    * `GET /api/driver-data` - driver list with team colours
    * `GET /api/session-info` - race info, weather and results
    * `GET /api/rounds-list` - the races available in the cacche, grouped by year, with their round numbers

#### Tyre Degradation Model

The core of this project is the tyre degradation estimation model, which is constructed as follow:
1.  **Fuel Consumption Estimation:** Estimated for the analyzed race over the full race length. The model assumes a 110kg start and 1kg of fuel left at the end, burned at a constant rate per lap
2.  **Linear Regression:** Applied to corrected lap times over the estimated tyre age for each stint, yielding degradation metrics in seconds lost per lap of tyre age.
3.  **Data Integrity:** Only "clean laps" are considered — laps with VSC/SC, pit entry/exit events, and the first lap are excluded.


#### Caching Strategy

F1's live-timing servers block requests coming from cloud IP addreses, so a VM cannot download race data on demand. Races are therefore downloaded beforehand and stored in a FastF1 cache on disk-
*   **Populating the cache:** run `save_cached.py` locally, for a whole season or for a single round (see ["Reproduction"](#reproduction--installation)). The resulting `backend/cache` folder is copied to the VM and mounted into the container. 
*   **Available races:** `/api/rounds-list` reads the cache folder, so the frontend only offers races that are actually available.
*   **Optimization Trade-off:** loaded session are large, and in order to keep RAM usage withing the VM limit, the server keeps at most **3** parse session in memory (`lru_cache`), triggering reloads when switching between more than three races. The amounts of races stored can be modified in `f1_data.py`.

#### Backend Folder Structure

The backend is structured in this form
```
├── app
│   ├── main.py                 # Entry point: orchestrates FastAPI/Pydantic calls
│   ├── save_cached.py          # Script for saving race data to the cache
│   └── services
│       ├── f1_data.py          # Handles FastF1 API data retrieval and helper functions
│       └── tyre_analysis.py    # Contains the Pydantic models and constructs the data for the frontend
└── cache
```


### Frontend Architecture

The frontend is built using **React** and **Typescript**, with **Recharts** for the charts. It communicates with the backend via standard HTTP requests to the FastAPI endpoints
**Key Functionalities:**
1.  **Stint Analysis:** Allows users to analyze specific driver stints, visualizing tyre consumption based on compound, race strategy, and lap times.
2.  **Comparison Mode:** Enables the comparison of adjusted lap times across two or more drivers over the race duration.
3.  **Telemetry Analysis:** Dedicated views to analyze key telemetry metrics (speed, gears, throttle, and engine RPM) for the fastest laps of selected drivers.
4.  **Contextual Display:** A persistent right sidebar displaying relevant Grand Prix information and the race track.


>[!WARNING] The multi-driver comparison functionality is still under active development, as the *Distribution* view is not implemented for multiple drivers. 


#### Frontend Folder Structure


```
├── src
│   ├── App.tsx
│   ├── api
│   │   └── client.ts
│   ├── components
│   │   ├── BoxPlotChart.tsx
│   │   ├── DriverMultiSelect.tsx
│   │   ├── RightSideBar.tsx
│   │   ├── SideBar.tsx
│   │   ├── TelemetryCharts.tsx
│   │   ├── TelemetryMulti.tsx
│   │   ├── TelemetrySingle.tsx
│   │   ├── TopBar.tsx
│   │   ├── TyreDegradationCharts.tsx
│   │   ├── TyreDegradationMulti.tsx
│   │   └── TyreDegradationSingle.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── types
│   │   └── f1.ts
```


### Deployment

*   **Backend:** Hosted on an Oracle VM to handle the demanding computational requirements of Python scripts and heavy data processing. Deployed using docker compose script.
*   **Frontend:** Hosted on Netlify for global accessibility and dynamic interactivity. The `VITE_API_URL` environment variable points to the backend URL.


## Reproduction & Installation

Requirements:
- Node.js (for frontend)
- Python 3.11 or newer (for backend)
- [uv](https://docs.astral.sh/uv/) package manager

To replicate this project and test it on your machine follow these steps
1. Clone this repository

    ```
    git clone https://github.com/adb-coding/f1-tyre-deg
    cd f1-tyre-deg
    ```
2. Install the requirements for the backend scripts from the repository root:
    ```
    cd backend
    uv sync
    ```
    The next steps assumes that uv was used, so only this processed is treated.
3. (Optional) Download some races into the cache. From the repository root:
    ```
    uv run backend/app/save_cached.py 2026            # all races of the season so far  
    uv run backend/app/save_cached.py 2026 --round 3  # a single round
    ```

4. On a dedicated terminal, move to the backend folder and initiate the backend server through
    ```
    uv run uvicorn app.main:app --reload --port 8000
    ```

    Test the connection by either visiting `localhost:8000`, by using FastAPI UI at `127.0.0.1:8000/docs/` or through the terminal using 
    ```
    curl http://localhost:8000/api/rounds-list 
    ```
    or one of the other functions.

5. Crate `forntend/.env` containing the backend URL:
    ```
    VITE_API_URL=http://localhost:8000
    ```  

6. Install the dependencies for the frontend. Open another terminal and move to the frontend folder 
    ```
    cd frontend
    npm install
    npm run dev
    ```
    Access the dashboard at `localhost:5173`

The `docker-compose.yml` in the repository root is the VM deployment setup. It requires a `DOMAIN` environment variable and port 80/443 for Caddy's HTTPS, so it is not mean as a quick local run.


## Limitations

The computations are mere estimations, that come from semplifications of real race conditions. 
- Fuel consumption data is not publicly available, so the model assumes a 110kg start and 1kg of fuel at the finish, consumed at a constant rate. 
- The model does not consider the track temperature and drag reduction or increase coming from traffic.
- Degradation is fitted with a linear model per stint, which cannot capture the non-linear drop-off at the end of a tyre's life.

This project was therfore carried to train on my data analysis skills and the capacity to produce a full stack application in a relative short time. 

