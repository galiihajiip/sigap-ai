# Sigap AI — Strict API Contract

> **Frontend polling note:** live endpoints (`/api/system`, `/api/cameras`, `/api/intersections/{id}/live`) should be polled **every 2 seconds** (`TICK_SECONDS = 2`).

All paths are prefixed with `/api` (`API_PREFIX`).

---

## 1. System

### `GET /api/system`
Returns global system status.

**Response `200`**
```json
{
  "systemStatus": {
    "systemOperational": true,
    "mode": "AI_ACTIVE",
    "lastUpdate": "2026-02-27T08:00:00+00:00",
    "live": true,
    "message": "All systems nominal."
  },
  "cameraFeeds": [],
  "recommendations": []
}
```

---

## 2. Cameras

### `GET /api/cameras`
Returns all camera feed cards.

**Response `200`**
```json
[
  {
    "cameraId": "CAM-1",
    "label": "Cam 1 - Main St.",
    "status": "LIVE",
    "flowLabel": "Moderate Flow",
    "avgSpeedKmh": 32.5,
    "lastFrameTime": "2026-02-27T08:00:00+00:00"
  },
  {
    "cameraId": "CAM-2",
    "label": "Cam 2 - Bypass Rd.",
    "status": "OFFLINE",
    "flowLabel": "Free Flow",
    "avgSpeedKmh": 0.0,
    "lastFrameTime": "2026-02-27T07:55:00+00:00"
  }
]
```

---

## 3. Intersections

### `GET /api/intersections`
Returns summary list of all managed intersections.

**Response `200`**
```json
[
  {
    "intersectionId": "SUR-4092",
    "locationName": "Jl. Soedirman, Surabaya",
    "city": "Surabaya",
    "isActive": true,
    "currentSignalPlan": {
      "redSeconds": 45,
      "greenSeconds": 45,
      "yellowSeconds": 5
    },
    "lastAdjustedAt": "2026-02-27T07:58:00+00:00"
  }
]
```

---

### `GET /api/intersections/{intersectionId}/live`
Returns real-time metrics for one intersection. **Poll every 2 s.**

**Path param:** `intersectionId` — e.g. `SUR-4092`

**Response `200`**
```json
{
  "timestamp": "2026-02-27T08:00:02+00:00",
  "currentVolume": 124,
  "avgSpeedKmh": 28.4,
  "queueLengthVehicles": 17,
  "waitTimeMinutes": 2.3,
  "weatherTempC": 31.0,
  "weatherCondition": "Rain",
  "accidentsCount": 0,
  "flowRateCarsPerMin": 41.3,
  "densityPercent": 76.0
}
```

---

### `GET /api/intersections/{intersectionId}/prediction/15m`
Returns the 15-minute ahead prediction.

**Response `200`**
```json
{
  "modelName": "LSTM Neural Network",
  "modelFile": "sigap_model.h5",
  "currentVolume": 124,
  "predictedVolume15m": 158,
  "deltaVolume": 34,
  "congestionRiskPercent": 76.0,
  "riskLabel": "High",
  "peakForecastTime": "08:15",
  "systemConfidencePercent": 95.0
}
```

---

### `GET /api/intersections/{intersectionId}/forecast?horizons=2h,4h`
Returns multi-horizon forecast timeline.

**Query param:** `horizons` — comma-separated list, e.g. `2h,4h`

**Response `200`**
```json
{
  "points": [
    {
      "timestamp": "2026-02-27T08:00:00+00:00",
      "currentVolume": 124,
      "predictedVolume": null,
      "congestionThreshold": 80.0,
      "congestionDetected": false
    },
    {
      "timestamp": "2026-02-27T10:00:00+00:00",
      "currentVolume": 124,
      "predictedVolume": 181,
      "congestionThreshold": 80.0,
      "congestionDetected": true
    }
  ],
  "pointsCount": 2,
  "latestCurrentVolume": 124,
  "latestPredictedVolume": 181,
  "congestionDetected": true
}
```

---

## 4. Recommendations

### `GET /api/recommendations/top`
Returns top pending recommendations sorted by confidence descending.

**Response `200`**
```json
[
  {
    "recommendationId": "REC-001",
    "createdAt": "2026-02-27T07:59:00+00:00",
    "status": "PENDING",
    "targetLocationName": "Jl. Soedirman, Surabaya",
    "targetIntersectionId": "SUR-4092",
    "targetApproach": "S",
    "alertTitle": "Critical Alert: Southbound Density",
    "alertDescription": "Southbound density has reached 76%. Recommend extending green phase by 15 s.",
    "predictedDelayIfNoActionMinutes": 4.5,
    "currentGreenSeconds": 45,
    "recommendedGreenSeconds": 60,
    "deltaSeconds": 15,
    "confidencePercent": 95.0
  }
]
```

---

### `POST /api/recommendations/{recommendationId}/apply`
Applies a recommendation and sets status to `APPLIED`.

**Path param:** `recommendationId` — e.g. `REC-001`

**Response `200`**
```json
{
  "recommendationId": "REC-001",
  "status": "APPLIED",
  "appliedAt": "2026-02-27T08:00:05+00:00"
}
```

---

### `POST /api/recommendations/{recommendationId}/reject`
Rejects a recommendation and sets status to `REJECTED`.

**Path param:** `recommendationId` — e.g. `REC-001`

**Response `200`**
```json
{
  "recommendationId": "REC-001",
  "status": "REJECTED",
  "rejectedAt": "2026-02-27T08:00:10+00:00"
}
```

---

## 5. Manual Adjustment

### `POST /api/intersections/{intersectionId}/adjust`
Manually adjusts the green phase for a specific approach.

**Path param:** `intersectionId` — e.g. `SUR-4092`

**Request body**
```json
{
  "approach": "N",
  "deltaSeconds": 10
}
```

**Response `200`**
```json
{
  "intersectionId": "SUR-4092",
  "approach": "N",
  "previousGreenSeconds": 45,
  "newGreenSeconds": 55,
  "adjustedAt": "2026-02-27T08:00:20+00:00"
}
```

---

## 6. Analytics

### `GET /api/analytics/heatmap?days=7`
Returns congestion heatmap data for the past N days.

**Query param:** `days` — integer, default `7`

**Response `200`**
```json
{
  "heatmap": [
    {
      "locationName": "Jl. Soedirman, Surabaya",
      "intersectionId": "SUR-4092",
      "lat": -7.2575,
      "lng": 112.7521,
      "densityPercent": 76.0
    }
  ],
  "acceptanceRate": 87.5,
  "recurringCauses": ["Peak hour volume", "Weather: Rain", "Incident spillback"],
  "decisionLog": []
}
```

---

### `GET /api/analytics/decision-log?limit=100`
Returns paginated decision log rows.

**Query param:** `limit` — integer, default `100`

**Response `200`**
```json
[
  {
    "timestamp": "2026-02-27T07:58:00+00:00",
    "locationName": "Jl. Soedirman, Surabaya",
    "eventType": "Congestion Predicted",
    "aiPrediction": "Volume will reach 158 vehicles within 15 min",
    "humanAction": "Applied",
    "outcome": "Queue reduced by 4 vehicles",
    "details": "Green extended S approach +15 s"
  }
]
```

---

## 7. Notifications

### `GET /api/notifications`
Returns all notification items sorted newest first.

**Response `200`**
```json
[
  {
    "notificationId": "NOTIF-001",
    "type": "warning",
    "message": "Congestion risk HIGH at SUR-4092 southbound.",
    "createdAt": "2026-02-27T07:59:30+00:00",
    "read": false
  },
  {
    "notificationId": "NOTIF-002",
    "type": "check_circle",
    "message": "Recommendation REC-001 applied successfully.",
    "createdAt": "2026-02-27T08:00:05+00:00",
    "read": true
  }
]
```

---

### `POST /api/notifications/mark-all-read`
Marks all notifications as read.

**Response `200`**
```json
{
  "marked": 2
}
```

---

## 8. Settings

### `GET /api/settings`
Returns current system settings.

**Response `200`**
```json
{
  "congestionAlertCapacityPercent": 80,
  "incidentDetectionSensitivity": "MEDIUM",
  "notificationChannels": {
    "email": true,
    "sms": false,
    "desktopPush": true
  },
  "intersectionOverdrives": [
    {
      "intersectionId": "SUR-4092",
      "locationName": "Jl. Soedirman, Surabaya",
      "status": "AUTO",
      "redSeconds": 45,
      "greenSeconds": 45,
      "yellowSeconds": 5
    }
  ]
}
```

---

### `PUT /api/settings`
Updates system settings. Accepts full `SettingsPayload`.

**Request body** *(same shape as `GET /api/settings` response)*

**Response `200`**
```json
{
  "saved": true,
  "updatedAt": "2026-02-27T08:01:00+00:00"
}
```
