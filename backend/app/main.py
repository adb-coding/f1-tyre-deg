from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.services.tyre_analysis import compute_tyre_deg, compute_tyre_deg_multi, compute_driver_data, compute_session_data, DegradationResult
from app.services.f1_data import get_races_cached, calculate_drivers_gap, load_cached_session, SessionDataUnavailable

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://f1-tyre-deg.netlify.app"],
    allow_methods=["GET","POST"],
    allow_headers=["*"],
)

@app.exception_handler(SessionDataUnavailable)
def session_unavailable(request, exc):
    return JSONResponse(status_code=503, content={"detail": str(exc)})


class MultiDriverRequest(BaseModel):
    year: int
    round: int
    drivers: list[str]

class GapResult(BaseModel):
    reference: str
    rows: list[dict[str, float | None]]


@app.get("/")
def root():
    return {"status": "ok", "service": "f1-tyre-degradation-api"}

@app.get("/api/tyre-degradation")
def tyre_degradation(year: int, round: int, driver: str):
    return compute_tyre_deg(year, round, driver)

@app.post("/api/tyre-degradation/multi", response_model=dict[str, DegradationResult])
def tyre_degradation_multi(req: MultiDriverRequest):
    return compute_tyre_deg_multi(req.year, req.round, req.drivers)

@app.post("/api/gap", response_model=GapResult)
def drivers_gap(req: MultiDriverRequest):
    session = load_cached_session(req.year, req.round)
    return calculate_drivers_gap(session, req.drivers)

@app.get("/api/driver-data")
def driver_data(year: int, round: int):
    return compute_driver_data(year, round)

@app.get("/api/session-info")
def session_info(year: int, round: int):
    return compute_session_data(year, round)


@app.get("/api/rounds-list")
def round_info():
    return get_races_cached()
