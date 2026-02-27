from __future__ import annotations

from typing import Dict, List, Tuple

from core.config import (
    CLEARANCE_SECONDS,
    CYCLE_SECONDS,
    MAX_GREEN_SECONDS,
    MIN_GREEN_SECONDS,
)

# Maximum total green budget available per cycle across all approaches
_MAX_TOTAL_GREEN = CYCLE_SECONDS - CLEARANCE_SECONDS


def clamp_green_seconds(value: int) -> int:
    """
    Clamp a proposed green-phase duration to the safety range
    [MIN_GREEN_SECONDS, MAX_GREEN_SECONDS].

    Parameters
    ----------
    value : int
        Proposed green duration in seconds.

    Returns
    -------
    int
        Clamped green duration.
    """
    return max(MIN_GREEN_SECONDS, min(MAX_GREEN_SECONDS, value))


def validate_plan(greens_dict: Dict[str, int]) -> Tuple[bool, List[str]]:
    """
    Validate a full signal plan (one green value per approach).

    Checks:
    1. Each approach green is within [MIN_GREEN_SECONDS, MAX_GREEN_SECONDS].
    2. Sum of all greens does not exceed CYCLE_SECONDS - CLEARANCE_SECONDS.

    Parameters
    ----------
    greens_dict : dict[str, int]
        Mapping of approach label → green duration in seconds.
        e.g. {"N": 45, "E": 20, "S": 45, "W": 20}

    Returns
    -------
    (valid, errors) : (bool, list[str])
        *valid* is True only when *errors* is empty.
    """
    errors: List[str] = []

    for approach, green in greens_dict.items():
        if green < MIN_GREEN_SECONDS:
            errors.append(
                f"Approach {approach}: green {green}s is below minimum "
                f"{MIN_GREEN_SECONDS}s."
            )
        if green > MAX_GREEN_SECONDS:
            errors.append(
                f"Approach {approach}: green {green}s exceeds maximum "
                f"{MAX_GREEN_SECONDS}s."
            )

    total = sum(greens_dict.values())
    if total > _MAX_TOTAL_GREEN:
        errors.append(
            f"Total green {total}s exceeds budget of {_MAX_TOTAL_GREEN}s "
            f"(CYCLE_SECONDS {CYCLE_SECONDS}s - CLEARANCE_SECONDS {CLEARANCE_SECONDS}s)."
        )

    return (len(errors) == 0, errors)
