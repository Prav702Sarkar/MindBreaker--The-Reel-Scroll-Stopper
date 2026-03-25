from pydantic import BaseModel, Field

class ScrollTelemetry(BaseModel):
    """Telemetry data from the Chrome extension."""
    user_id: str
    platform: str                 # e.g., Twitter, TikTok
    scroll_velocity: float = Field(..., description="pixels per second")
    posts_bypassed: int
    dwell_time_avg: float = Field(..., description="average dwell time in seconds")
    clicks: int

class InterventionResponse(BaseModel):
    """Response sent back to the extension."""
    intervention_triggered: bool
    message: str

class ProfileResponse(BaseModel):
    """Optional response for retrieving a user's profile."""
    user_id: str
    profile: str

class SessionEndRequest(BaseModel):
    """Request to end a session and get analysis."""
    user_id: str
    platform: str
    session_start: str  # ISO format datetime string
    session_duration_seconds: int