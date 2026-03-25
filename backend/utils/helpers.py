import asyncio
from datetime import date
from typing import Dict

# Global dictionary to hold locks per user
user_locks: Dict[str, asyncio.Lock] = {}

def get_today_str() -> str:
    """Return today's date in ISO format."""
    return date.today().isoformat()

async def get_user_lock(user_id: str) -> asyncio.Lock:
    """Return an asyncio lock for the given user ID, creating it if necessary."""
    if user_id not in user_locks:
        user_locks[user_id] = asyncio.Lock()
    return user_locks[user_id]