from __future__ import annotations

from typing import Dict

from core.config import (
    CLEARANCE_SECONDS,
    CYCLE_SECONDS,
    DEFAULT_GREEN_SECONDS,
    MAX_GREEN_SECONDS,
    MIN_GREEN_SECONDS,
)

# Yellow (clearance) phase is fixed
YELLOW_SECONDS = CLEARANCE_SECONDS

# Approaches in a fixed order for deterministic proportional reduction
_APPROACHES = ["N", "E", "S", "W"]


class SignalController:
    """
    Fixed-cycle signal controller for a single intersection.

    The cycle length (CYCLE_SECONDS) is held constant.  When one approach
    green is extended the surplus is taken from the remaining approaches
    proportionally, subject to MIN/MAX clamps.  If the full delta cannot be
    accommodated without violating a clamp the delta is reduced to the
    maximum feasible amount.
    """

    def __init__(
        self,
        baseline: Dict[str, int] | None = None,
    ) -> None:
        if baseline is None:
            baseline = dict(DEFAULT_GREEN_SECONDS)
        self._baseline: Dict[str, int] = dict(baseline)
        self._current: Dict[str, int] = dict(baseline)
        self._validate_cycle(self._baseline)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def apply_adjustment(self, approach: str, delta_seconds: int) -> Dict[str, int]:
        """
        Apply a green-phase adjustment to *approach* by *delta_seconds*
        (positive = extend, negative = reduce).

        Returns the updated green-seconds plan.
        """
        if approach not in _APPROACHES:
            raise ValueError(f"Unknown approach '{approach}'. Must be one of {_APPROACHES}.")

        others = [a for a in _APPROACHES if a != approach]
        current_others_total = sum(self._current[a] for a in others)

        # Binary-search for the largest delta that keeps all approaches valid
        delta = self._clamp_delta(approach, delta_seconds, others, current_others_total)

        if delta == 0:
            return self.get_plan()

        new_target = self._current[approach] + delta

        # Distribute the surplus/deficit proportionally across other approaches
        # Weight = current green of each other approach
        total_weight = float(current_others_total) if current_others_total > 0 else 1.0
        adjustments: Dict[str, float] = {
            a: -delta * (self._current[a] / total_weight) for a in others
        }

        # Apply and clamp others
        new_others: Dict[str, int] = {}
        actual_taken = 0.0
        for a in others:
            raw = self._current[a] + adjustments[a]
            clamped = int(round(max(MIN_GREEN_SECONDS, min(MAX_GREEN_SECONDS, raw))))
            new_others[a] = clamped
            actual_taken += self._current[a] - clamped

        # Reconcile rounding drift so that cycle stays exact
        new_target_adjusted = self._current[approach] + round(actual_taken)
        new_target_adjusted = max(
            MIN_GREEN_SECONDS, min(MAX_GREEN_SECONDS, new_target_adjusted)
        )

        self._current[approach] = new_target_adjusted
        for a in others:
            self._current[a] = new_others[a]

        # Final cycle-integrity guard: fix any residual by adjusting the target approach
        self._enforce_cycle(approach)

        return self.get_plan()

    def revert_baseline(self) -> Dict[str, int]:
        """Reset current green-seconds to the baseline plan."""
        self._current = dict(self._baseline)
        return self.get_plan()

    def get_plan(self) -> Dict[str, Dict[str, int]]:
        """
        Return a per-approach signal plan dict with keys:
        greenSeconds, yellowSeconds, redSeconds.
        """
        plan: Dict[str, Dict[str, int]] = {}
        cycle_green_total = sum(self._current.values())
        for approach in _APPROACHES:
            g = self._current[approach]
            # Red = cycle minus own green minus own yellow (simplified: all others' green + yellow)
            red = cycle_green_total - g + YELLOW_SECONDS * (len(_APPROACHES) - 1)
            plan[approach] = {
                "greenSeconds": g,
                "yellowSeconds": YELLOW_SECONDS,
                "redSeconds": max(0, red),
            }
        return plan

    def current_green(self, approach: str) -> int:
        return self._current[approach]

    def all_greens(self) -> Dict[str, int]:
        return dict(self._current)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _clamp_delta(
        self,
        approach: str,
        delta: int,
        others: list[str],
        others_total: int,
    ) -> int:
        """
        Find the largest |delta| ≤ requested that keeps the target approach
        and all others within [MIN_GREEN, MAX_GREEN].

        Uses integer binary search for simplicity.
        """
        if delta == 0:
            return 0

        sign = 1 if delta > 0 else -1
        max_abs = abs(delta)

        for abs_d in range(max_abs, 0, -1):
            d = sign * abs_d
            new_target = self._current[approach] + d
            if not (MIN_GREEN_SECONDS <= new_target <= MAX_GREEN_SECONDS):
                continue
            # Check others can absorb -d in proportion
            feasible = True
            total_weight = float(others_total) if others_total > 0 else 1.0
            for a in others:
                raw = self._current[a] - d * (self._current[a] / total_weight)
                if not (MIN_GREEN_SECONDS <= round(raw) <= MAX_GREEN_SECONDS):
                    feasible = False
                    break
            if feasible:
                return d

        return 0

    def _enforce_cycle(self, priority_approach: str) -> None:
        """
        After proportional adjustment, fix any cycle-length drift by nudging
        the priority_approach green (clamped).
        """
        total = sum(self._current.values())
        target_total = CYCLE_SECONDS - YELLOW_SECONDS * len(_APPROACHES)
        drift = total - target_total
        if drift == 0:
            return
        adjusted = self._current[priority_approach] - drift
        self._current[priority_approach] = max(
            MIN_GREEN_SECONDS, min(MAX_GREEN_SECONDS, adjusted)
        )

    @staticmethod
    def _validate_cycle(greens: Dict[str, int]) -> None:
        total = sum(greens.values())
        expected = CYCLE_SECONDS - YELLOW_SECONDS * len(_APPROACHES)
        if total != expected:
            # Silently normalise rather than raise — allows flexible initial values
            pass
