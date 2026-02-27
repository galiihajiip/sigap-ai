from datetime import datetime
import random
import threading
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd


current_data = {
    "timestamp": None,
    "toll_km": "KM10",
    "vehicle_volume": 0,
    "avg_speed_kmh": 0,
    "congestion_level": "LOW",
    "congestion_risk_pct": 0,
    "weather": "Unknown"
}

data_lock = threading.Lock()

app = FastAPI(title="SIGAP.AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



def update_realtime_data():
    global current_data
    while True:
        vehicle_volume = random.randint(400, 800)
        avg_speed = random.randint(15, 45)
        risk = min(100, int(vehicle_volume / 8))

        with data_lock:
            current_data = {
                "timestamp": datetime.now().isoformat(),
                "toll_km": "KM10",
                "vehicle_volume": vehicle_volume,
                "avg_speed_kmh": avg_speed,
                "congestion_level": "HIGH" if risk > 70 else "MEDIUM",
                "congestion_risk_pct": risk,
                "weather": "Rain"
            }

        time.sleep(2)

@app.on_event("startup")
def start_updater():
    threading.Thread(target=update_realtime_data, daemon=True).start()


@app.get("/traffic/realtime")
def get_realtime():
    with data_lock:
        return {
            "status": "success",
            "data": [current_data]
        }

@app.get("/traffic/prediction")
def get_prediction():
    df = pd.read_csv("data/traffic_prediction.csv")
    return df.to_dict(orient="records")

@app.get("/ai/recommendation")
def get_recommendation():
    df = pd.read_csv("data/ai_recommendation.csv")
    return df.to_dict(orient="records")

@app.post("/operator/approve")
def approve_action():
    return {
        "status": "APPROVED",
        "message": "Flush Strategy Applied"
    }
