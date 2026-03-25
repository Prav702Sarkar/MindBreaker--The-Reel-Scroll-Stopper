import os
from typing import List
from openai import AsyncOpenAI
from models import ScrollTelemetry

ASI_API_KEY = os.getenv("ASI_API_KEY")
ASI_MODEL = "asi1-mini"
ASI_BASE_URL = "https://api.asi1.ai/v1"

asi_client = AsyncOpenAI(api_key=ASI_API_KEY, base_url=ASI_BASE_URL)

async def generate_profile(user_id: str, telemetry_list: List[ScrollTelemetry]) -> str:
    """
    Aggregate daily telemetry and call ASI‑1 to produce a psychological profile.
    Returns the profile text, or an error string on failure.
    """
    if not telemetry_list:
        return "No telemetry data to analyse."

    # Aggregate statistics
    platform_counts = {}
    total_velocity = 0.0
    total_dwell = 0.0
    total_bypassed = 0
    total_clicks = 0
    for t in telemetry_list:
        platform_counts[t.platform] = platform_counts.get(t.platform, 0) + 1
        total_velocity += t.scroll_velocity
        total_dwell += t.dwell_time_avg
        total_bypassed += t.posts_bypassed
        total_clicks += t.clicks
    count = len(telemetry_list)
    avg_velocity = total_velocity / count if count else 0
    avg_dwell = total_dwell / count if count else 0

    summary = (
        f"User {user_id} had {count} sessions today. "
        f"Platform distribution: {platform_counts}. "
        f"Average scroll velocity: {avg_velocity:.1f} px/s. "
        f"Average dwell time: {avg_dwell:.1f} s. "
        f"Total posts bypassed: {total_bypassed}. "
        f"Total clicks: {total_clicks}."
    )

    prompt = (
        "You are a Cognitive Behavioral Agent. Based on the following daily usage summary, "
        "generate a deep psychological profile of the user's doomscrolling patterns. "
        "Highlight possible triggers, emotional states, and suggest a short intervention strategy.\n\n"
        f"Summary: {summary}\n\n"
        "Profile:"
    )

    try:
        response = await asi_client.chat.completions.create(
            model=ASI_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful psychologist specializing in digital addiction."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"ASI‑1 API error for user {user_id}: {e}")
        return "Could not generate profile due to a technical issue."