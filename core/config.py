APP_NAME = "Sigap AI Backend"
API_PREFIX = "/api"
TICK_SECONDS = 2

# Simulation scale
SIM_MINUTES_PER_TICK = 1
CYCLE_SECONDS = 90

# Signal safety
MIN_GREEN_SECONDS = 20
MAX_GREEN_SECONDS = 70
CLEARANCE_SECONDS = 5

# Default initial greens (match UI example Current Green 45s)
DEFAULT_GREEN_SECONDS = {"N": 45, "E": 20, "S": 45, "W": 20}

# Congestion thresholds
CONGESTION_ALERT_CAPACITY_PERCENT = 80
CONGESTION_RISK_HIGH_PERCENT = 76
DEFAULT_SYSTEM_CONFIDENCE_PERCENT = 95

# Stale sensor
SENSOR_STALE_SECONDS = 60

# Timezone
TIMEZONE_NAME = "Asia/Jakarta"

# Weather provider
WEATHER_PROVIDER = "BMKG"  # "BMKG" or "AUTO"
BMKG_FORECAST_URL = "https://api.bmkg.go.id/publik/prakiraan-cuaca"
BMKG_ADM4_DEFAULT = "32.73.02.1006"  # Kel. Lebak Siliwangi, Kec. Coblong (dekat ITB)
WEATHER_REFRESH_SECONDS = 600  # 10 minutes
WEATHER_FALLBACK_MODE = "STATIC"  # "STATIC" or "OPEN_METEO"

# Weather defaults (used when provider is unavailable)
DEFAULT_WEATHER_TEMP_C = 31.0
DEFAULT_WEATHER_CONDITION = "Rain"
DEFAULT_WEATHER_DESC = "Hujan"

