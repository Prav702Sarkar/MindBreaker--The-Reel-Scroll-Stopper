from models import ScrollTelemetry

def calculate_mindless_score(telemetry: ScrollTelemetry) -> int:
    """
    Calculate a 0-100 score based on:
    - High scroll velocity (>500 px/s) -> +40
    - No clicks -> +30
    - Low dwell time (<3 seconds) -> +30
    """
    score = 0
    if telemetry.scroll_velocity > 500:
        score += 40
    if telemetry.clicks == 0:
        score += 30
    if telemetry.dwell_time_avg < 3:
        score += 30
    return min(score, 100)   # Cap at 100