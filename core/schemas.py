from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# 1. SystemStatus
# ---------------------------------------------------------------------------
class SystemStatus(BaseModel):
    systemOperational: bool
    mode: str  # "AI_ACTIVE" | "LOCAL_FALLBACK"
    lastUpdate: str  # ISO
    live: bool
    message: str


# ---------------------------------------------------------------------------
# 2. CameraFeedCard
# ---------------------------------------------------------------------------
class CameraFeedCard(BaseModel):
    cameraId: str          # e.g. "CAM-1"
    label: str             # e.g. "Cam 1 - Main St."
    status: str            # "LIVE" | "OFFLINE"
    flowLabel: str         # "Free Flow" | "Moderate Flow" | "Slow Traffic"
    avgSpeedKmh: float
    lastFrameTime: str     # ISO


# ---------------------------------------------------------------------------
# 3. IntersectionSummary
# ---------------------------------------------------------------------------
class SignalPlan(BaseModel):
    redSeconds: int
    greenSeconds: int
    yellowSeconds: int


class IntersectionSummary(BaseModel):
    intersectionId: str        # e.g. "SUR-4092"
    locationName: str          # e.g. "Jl. Soedirman, Surabaya"
    city: str
    isActive: bool
    currentSignalPlan: Dict[str, Any]  # keys: redSeconds, greenSeconds, yellowSeconds
    lastAdjustedAt: Optional[str] = None


# ---------------------------------------------------------------------------
# 4. LiveMetrics
# ---------------------------------------------------------------------------
class LiveMetrics(BaseModel):
    timestamp: str
    currentVolume: int          # vehicles per cycle (simulated sensor)
    avgSpeedKmh: float
    queueLengthVehicles: int
    waitTimeMinutes: float
    weatherTempC: float
    weatherCondition: str       # e.g. "Rain" | "Clear"
    accidentsCount: int
    flowRateCarsPerMin: float
    densityPercent: float


# ---------------------------------------------------------------------------
# 5. Prediction15m
# ---------------------------------------------------------------------------
class Prediction15m(BaseModel):
    modelName: str                  # e.g. "LSTM Neural Network"
    modelFile: str                  # e.g. "sigap_model.h5"
    currentVolume: int
    predictedVolume15m: int
    deltaVolume: int
    congestionRiskPercent: float
    riskLabel: str                  # "Smooth" | "Moderate" | "High" | "Critical"
    peakForecastTime: str           # ISO or HH:MM
    systemConfidencePercent: float


# ---------------------------------------------------------------------------
# 6. TimelinePoint
# ---------------------------------------------------------------------------
class TimelinePoint(BaseModel):
    timestamp: str
    currentVolume: int
    predictedVolume: Optional[int] = None
    congestionThreshold: float
    congestionDetected: bool


# ---------------------------------------------------------------------------
# 7. PredictionTimeline
# ---------------------------------------------------------------------------
class PredictionTimeline(BaseModel):
    points: List[TimelinePoint]
    pointsCount: int
    latestCurrentVolume: int
    latestPredictedVolume: Optional[int] = None
    congestionDetected: bool


# ---------------------------------------------------------------------------
# 8. Recommendation
# ---------------------------------------------------------------------------
class Recommendation(BaseModel):
    recommendationId: str
    createdAt: str
    status: str                         # "PENDING" | "APPLIED" | "REJECTED" | "MODIFIED"
    targetLocationName: str
    targetIntersectionId: str
    targetApproach: str                 # "N" | "E" | "S" | "W"
    alertTitle: str                     # e.g. "Critical Alert: Southbound Density"
    alertDescription: str
    predictedDelayIfNoActionMinutes: float
    currentGreenSeconds: int
    recommendedGreenSeconds: int
    deltaSeconds: int
    confidencePercent: float


# ---------------------------------------------------------------------------
# 9. HotspotPrediction
# ---------------------------------------------------------------------------
class HotspotPrediction(BaseModel):
    locationName: str
    intersectionId: str
    predictedDelayMinutes: float
    predictedQueueVehicles: int
    etaMinutes: int
    severityLabel: str  # "Smooth" | "Slow Traffic" | "Heavy Traffic"


# ---------------------------------------------------------------------------
# 10. NotificationItem
# ---------------------------------------------------------------------------
class NotificationItem(BaseModel):
    notificationId: str
    type: str       # "warning" | "traffic" | "check_circle" | "videocam" | "update"
    message: str
    createdAt: str
    read: bool


# ---------------------------------------------------------------------------
# 11. DecisionLogRow
# ---------------------------------------------------------------------------
class DecisionLogRow(BaseModel):
    timestamp: str
    locationName: str
    eventType: str
    aiPrediction: str
    humanAction: str    # "Applied" | "Rejected" | "Modified" | "No Action"
    outcome: str
    details: str


# ---------------------------------------------------------------------------
# 12. SettingsPayload
# ---------------------------------------------------------------------------
class NotificationChannels(BaseModel):
    email: bool
    sms: bool
    desktopPush: bool


class IntersectionOverdrive(BaseModel):
    intersectionId: str
    locationName: str
    status: str
    redSeconds: int
    greenSeconds: int
    yellowSeconds: int


class SettingsPayload(BaseModel):
    congestionAlertCapacityPercent: int
    incidentDetectionSensitivity: str       # "LOW" | "MEDIUM" | "HIGH"
    notificationChannels: NotificationChannels
    intersectionOverdrives: List[IntersectionOverdrive]


# ---------------------------------------------------------------------------
# Response wrappers
# ---------------------------------------------------------------------------
class SystemOverviewResponse(BaseModel):
    systemStatus: SystemStatus
    cameraFeeds: List[CameraFeedCard]
    recommendations: List[Recommendation]


class HeatmapPoint(BaseModel):
    locationName: str
    intersectionId: str
    lat: float
    lng: float
    densityPercent: float


class AnalyticsResponse(BaseModel):
    heatmap: List[HeatmapPoint]
    acceptanceRate: float           # 0–100
    recurringCauses: List[str]
    decisionLog: List[DecisionLogRow]
