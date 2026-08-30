from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.services.tyre_analysis import compute_tyre_deg, compute_tyre_deg_multi, compute_driver_data, compute_session_data, DegradationResult
# from app.services.f1_data import load_session, clean_data

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://f1-tyre-deg.onrender.com"],
    allow_methods=["GET","POST"],
    allow_headers=["*"],
)

class MultiDriverRequest(BaseModel):
    year: int
    round: int
    drivers: list[str]

@app.get("/api/tyre-degradation")
def tyre_degradation(year: int, round: int, driver: str):
    return compute_tyre_deg(year, round, driver)

@app.post("/api/tyre-degradation/multi", response_model=dict[str, DegradationResult])
def tyre_degradation_multi(req: MultiDriverRequest):
    return compute_tyre_deg_multi(req.year, req.round, req.drivers)

@app.get("/api/driver-data")
def driver_data(year: int, round: int):
    return compute_driver_data(year, round)

@app.get("/api/session-info")
def session_info(year: int, round: int):
    return compute_session_data(year, round)
