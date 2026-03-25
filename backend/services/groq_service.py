import os
import groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama3-8b-8192"

# Async client
groq_client = groq.AsyncGroq(api_key=GROQ_API_KEY)

async def get_groq_intervention(scroll_velocity: float, posts_bypassed: int,
                                dwell_time_avg: float, clicks: int) -> str:
    """
    Call Groq to generate a witty one‑sentence intervention.
    Returns the generated message or a fallback string on error.
    """
    prompt = (
        f"You are a witty, candid intervention system. The user has just exhibited doomscrolling behavior: "
        f"scrolling at {scroll_velocity} px/s, skipping {posts_bypassed} posts, "
        f"with an average dwell time of {dwell_time_avg} seconds and {clicks} clicks. "
        f"Generate a one‑sentence pattern interrupt to help them snap out of mindless scrolling."
    )
    try:
        response = await groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a friendly, direct intervention system."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=50,
            temperature=0.8
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq API error: {e}")
        return "Oops, I couldn't think of something witty right now. Maybe take a breath?"