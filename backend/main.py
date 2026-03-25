import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables FIRST, before importing services
load_dotenv()

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import and_

from models import ScrollTelemetry, InterventionResponse, ProfileResponse, SessionEndRequest
from services.rule_engine import calculate_mindless_score
from services.groq_service import get_groq_intervention
from services.asi_service import generate_profile
from services.stats_aggregator import aggregate_daily_stats, aggregate_weekly_stats, calculate_user_insights
from services.session_analyzer import end_session_and_analyze, check_extended_usage_warning, get_session_history
from storage import intervention_tracker, telemetry_store
from utils.helpers import get_user_lock
from database import init_db
from db_models import User, DailyStats
from database import SessionLocal

# ---------- FastAPI Lifespan ----------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database on startup
    init_db()
    print("✅ Database initialized")
    
    yield
    
    # Cleanup on shutdown (optional)
    print("🛑 Shutting down")

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Endpoints ----------
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "MindBreaker backend is running"}

@app.post("/api/auth/register")
async def register_user(user_id: str, email: str, full_name: str):
    """Register or update user with Clerk info"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            print(f"📝 Creating user {user_id} with Clerk info")
            user = User(id=user_id, email=email, full_name=full_name)
            db.add(user)
        else:
            # Update existing user with Clerk data
            print(f"🔄 Updating user {user_id} with Clerk info")
            user.email = email
            user.full_name = full_name
        
        db.commit()
        db.refresh(user)
        
        return {
            "success": True,
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    except Exception as e:
        db.rollback()
        print(f"❌ Error registering user: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.post("/api/telemetry", response_model=InterventionResponse)
async def ingest_telemetry(telemetry: ScrollTelemetry, background_tasks: BackgroundTasks):
    user_id = telemetry.user_id

    # Use a lock to safely modify shared state
    async with await get_user_lock(user_id):
        # Calculate MindlessScore
        score = calculate_mindless_score(telemetry)

        intervention_triggered = False
        message = "All good. Keep scrolling mindfully!"

        if score > 75:
            intervention_triggered = True
            # Get a witty message from Groq
            message = await get_groq_intervention(
                telemetry.scroll_velocity,
                telemetry.posts_bypassed,
                telemetry.dwell_time_avg,
                telemetry.clicks
            )

            # Increment intervention count and check for 3rd trigger
            count = intervention_tracker.increment_intervention_count(user_id, score, message)
            if count == 3:
                # Schedule background profile generation
                today_telemetry = telemetry_store.get_today_telemetry(user_id)
                background_tasks.add_task(
                    generate_profile_and_store,
                    user_id,
                    today_telemetry
                )
        
        # Store telemetry with intervention data
        telemetry_store.add_telemetry(
            user_id, 
            telemetry,
            mindless_score=score,
            intervention_triggered=intervention_triggered,
            intervention_message=message
        )
        
        # Aggregate into daily stats for graphing
        try:
            aggregate_daily_stats(user_id)
            print(f"✅ Daily stats updated for {user_id}")
        except Exception as e:
            print(f"⚠️ Failed to aggregate stats: {e}")
            # Don't fail the whole request if aggregation fails

        return InterventionResponse(
            intervention_triggered=intervention_triggered,
            message=message
        )

@app.get("/api/profile/{user_id}", response_model=ProfileResponse)
async def get_profile(user_id: str):
    """Retrieve a user's generated psychological profile"""
    db = SessionLocal()
    try:
        from db_models import UserProfile
        profile_record = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        
        if not profile_record:
            return ProfileResponse(user_id=user_id, profile="No profile generated yet.")
        
        return ProfileResponse(user_id=user_id, profile=profile_record.profile_text)
    finally:
        db.close()

@app.get("/api/user/{user_id}")
async def get_user_info(user_id: str):
    """Get user information and today's aggregated stats - creates user if doesn't exist"""
    db = SessionLocal()
    try:
        from datetime import date
        from db_models import Intervention
        
        user = db.query(User).filter(User.id == user_id).first()
        
        # Auto-create user if they don't exist (Clerk user logging in for first time)
        if not user:
            print(f"📝 Creating new user record for {user_id}")
            user = User(
                id=user_id,
                email=f"user_{user_id[:8]}@mindbreaker.local",  # Placeholder email
                full_name="MindBreaker User"  # Will be updated from Clerk on first telemetry
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        today = date.today()
        
        # Get today's aggregated daily stats
        daily_stats = db.query(DailyStats).filter(
            and_(
                DailyStats.user_id == user_id,
                DailyStats.date == today
            )
        ).first()
        
        # Get today's intervention count directly from interventions table
        intervention_count = db.query(Intervention).filter(
            and_(
                Intervention.user_id == user_id,
                Intervention.date == today
            )
        ).count()
        
        return {
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "created_at": user.created_at,
            "today_interventions": intervention_count,
            "daily_stats": {
                "date": str(today),
                "avg_scroll_velocity": daily_stats.avg_scroll_velocity if daily_stats else 0.0,
                "intervention_count": daily_stats.intervention_count if daily_stats else 0,
                "intervention_success_rate": daily_stats.intervention_success_rate if daily_stats else 0.0,
                "time_reclaimed_minutes": daily_stats.time_reclaimed_minutes if daily_stats else 0.0,
                "avg_mindless_score": daily_stats.avg_mindless_score if daily_stats else 0.0,
                "total_sessions": daily_stats.total_sessions if daily_stats else 0,
                "avg_dwell_time": daily_stats.avg_dwell_time if daily_stats else 0.0,
                "total_posts_bypassed": daily_stats.total_posts_bypassed if daily_stats else 0
            }
        }
    except Exception as e:
        print(f"❌ Error in get_user_info: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.get("/api/stats/weekly/{user_id}")
async def get_weekly_stats(user_id: str):
    """Get weekly aggregated statistics for dashboard graphing - returns aggregated daily stats"""
    try:
        # Use the stats aggregator to get properly aggregated weekly data
        weekly_data = aggregate_weekly_stats(user_id, days_back=7)
        print(f"📊 Returning weekly stats for {user_id}: {len(weekly_data['stats'])} days of data")
        return weekly_data
    except Exception as e:
        print(f"❌ Error in get_weekly_stats: {e}")
        # Return empty stats if there's an error instead of failing
        return {
            "user_id": user_id,
            "period": "7_days",
            "stats": []
        }

@app.get("/api/insights/{user_id}")
async def get_user_insights_endpoint(user_id: str):
    """Get high-level insights and trends for a user"""
    try:
        insights = calculate_user_insights(user_id)
        print(f"📈 Returning insights for {user_id}: {insights['trend']} trend")
        return insights
    except Exception as e:
        print(f"❌ Error in get_insights: {e}")
        return {
            "user_id": user_id,
            "error": "Could not calculate insights",
            "total_interventions": 0,
            "avg_success_rate": 0.0
        }

@app.get("/api/insights/{user_id}")
async def get_user_insights_endpoint(user_id: str):
    """Get high-level insights and trends for a user"""
    try:
        insights = calculate_user_insights(user_id)
        print(f"📈 Returning insights for {user_id}: {insights['trend']} trend")
        return insights
    except Exception as e:
        print(f"❌ Error in get_insights: {e}")
        return {
            "user_id": user_id,
            "error": "Could not calculate insights",
            "total_interventions": 0,
            "avg_success_rate": 0.0
        }

@app.post("/api/session/end")
async def end_session_endpoint(request: SessionEndRequest):
    """
    End a browsing session and receive immediate analysis and recommendations.
    """
    try:
        from datetime import datetime
        
        # Parse session start time
        session_start = datetime.fromisoformat(request.session_start)
        
        print(f"📊 Ending session for {request.user_id} on {request.platform}")
        
        # Get analysis
        analysis = end_session_and_analyze(
            user_id=request.user_id,
            platform=request.platform,
            session_start=session_start
        )
        
        return {
            "success": True,
            "analysis": analysis
        }
    except Exception as e:
        print(f"❌ Error ending session: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/session/check-warning/{user_id}")
async def check_extended_usage_endpoint(user_id: str, session_start_iso: str):
    """
    Check if user has exceeded 30-minute continuous usage.
    Returns warning if needed.
    """
    try:
        from datetime import datetime
        
        session_start = datetime.fromisoformat(session_start_iso)
        warning = check_extended_usage_warning(user_id, session_start)
        
        return {
            "user_id": user_id,
            "warning": warning
        }
    except Exception as e:
        print(f"❌ Error checking extended usage: {e}")
        return {
            "user_id": user_id,
            "warning": None,
            "error": str(e)
        }

@app.get("/api/sessions/history/{user_id}")
async def get_session_history_endpoint(user_id: str, days: int = 7):
    """
    Get user's session history for past N days.
    Shows pattern of usage over time.
    """
    try:
        sessions = get_session_history(user_id, days)
        return {
            "user_id": user_id,
            "period_days": days,
            "total_sessions": len(sessions),
            "sessions": sessions
        }
    except Exception as e:
        print(f"❌ Error getting session history: {e}")
        return {
            "user_id": user_id,
            "sessions": [],
            "error": str(e)
        }

# ---------- Helper for background task ----------
async def generate_profile_and_store(user_id: str, telemetry_list):
    """Background task: generate profile and store it"""
    db = SessionLocal()
    try:
        profile = await generate_profile(user_id, telemetry_list)
        
        from db_models import UserProfile
        user_profile = UserProfile(
            user_id=user_id,
            profile_text=profile,
            telemetry_count=len(telemetry_list)
        )
        db.add(user_profile)
        db.commit()
        print(f"✅ Profile generated for user {user_id}")
    except Exception as e:
        print(f"❌ Error generating profile: {e}")
        db.rollback()
    finally:
        db.close()

# ---------- Entry Point ----------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)