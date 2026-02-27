# Volume Semantics for Sigap AI UI

## Overview

The fields `currentVolume` and `predictedVolume15m` (and their 2h / 4h counterparts)
shown in the React UI represent a **queue-proxy congestion score**, not raw arrival flow.

---

## Definition

> **UI Volume** = `queue_length_veh × (3600 / CYCLE_SECONDS)`

That is: the number of vehicles currently waiting in queue, scaled to a
vehicles-per-hour equivalent using the signal cycle length (default 90 s).

| Quantity | Formula | Unit |
|---|---|---|
| `queue_proxy_vph` | `queue_length_veh × (3600 / 90)` | veh / hr |
| `currentVolume` (UI) | `queue_proxy_vph` (intersection total across all approaches) | veh / hr |
| `predictedVolume15m` (UI) | model output trained on `queue_proxy_vph` as label | veh / hr |

---

## Rationale

### Why queue-proxy instead of arrival flow?

1. **Demo narrative coherence** — when the AI recommends a green extension and
   the operator accepts, the controller allocates more green time to the congested
   approach.  Queue drains faster, `queue_length_veh` drops, and the UI volume
   **visibly decreases** within the next few ticks.  Using raw arrival flow
   (vehicles arriving per minute) would show no change because arrivals are
   demand-driven and unaffected by signal timing.

2. **Intuitive interpretation** — "volume" in the UI reads as "how congested is
   this intersection right now", which users understand as queue / backlog.

3. **Sensitivity to control actions** — queue-proxy is the only metric that
   responds to both arrival rate changes (demand) *and* service rate changes
   (green time), making it the most expressive single scalar for the UI card.

---

## Internal metrics kept separate

The following raw metrics are computed internally but **not** surfaced as
`currentVolume` in the UI:

| Metric | Where used |
|---|---|
| `vehicle_count_1min` | Simulation tick, CSV dataset, ML training features |
| `volume_veh_per_hour` | Derived from `vehicle_count_1min × 60`; ML training features & labels |
| `avg_speed_kmh` | `LiveMetrics.avg_speed_kmh` — separate UI field |
| `density_percent` | Recommendation engine threshold (≥ 80 % triggers rule) |

ML models (XGBoost, LSTM) are trained on `volume_veh_per_hour` as the raw label
and the inference output is post-processed to the queue-proxy representation
before being written to the state store.

---

## Post-processing step (tick_loop → state store)

```python
# Pseudocode in app/tick_loop.py
raw_vph          = predict_volume_vph(horizon=15)          # model output
queue_now        = sim.total_queue_length_veh()            # live queue
queue_proxy_vph  = queue_now * (3600 / CYCLE_SECONDS)      # UI representation
predicted_proxy  = raw_vph * QUEUE_PROXY_SCALE_FACTOR      # ~= raw × (queue/arrivals ratio)

store.update_live(currentVolume=queue_proxy_vph, ...)
store.update_prediction15m(predictedVolume15m=predicted_proxy, ...)
```

`QUEUE_PROXY_SCALE_FACTOR` is the rolling 5-minute ratio of
`queue_proxy_vph / volume_veh_per_hour`, updated each tick so the prediction
stays calibrated to actual queue levels.

---

## Effect on LSTM training

The LSTM short-term model (`ml/shortterm_15m.py`) is trained on
`volume_veh_per_hour` (arrival-rate label) because it is the smoothest and most
predictable signal.  The queue-proxy conversion is applied **at inference time**,
not during training.  This keeps the model general and separates the control-loop
semantics from the forecasting problem.
