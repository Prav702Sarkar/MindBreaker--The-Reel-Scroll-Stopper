"""
Session management and analysis service.
Provides insights after sessions and tracks extended usage.
"""

from datetime import datetime, date, timedelta
from sqlalchemy import and_, func
from db_models import SessionMetrics, ScrollTelemetryRecord, DailyStats, User, Intervention
from database import SessionLocal
from typing import Optional, Dict, List

def start_session(user_id: str, platform: str) -> Dict:
    """
    Mark the start of a browsing session.
    
    Args:
        user_id: User's ID
        platform: Platform (Twitter, TikTok, etc.)
        
    Returns:
        Session metadata
    """
    db = SessionLocal()
    try:
        session_start = datetime.utcnow()
        print(f"🟢 Session started for {user_id} on {platform} at {session_start}")
        
        return {
            "session_start": session_start.isoformat(),
            "platform": platform,
            "user_id": user_id,
            "status": "active"
        }
    finally:
        db.close()

def end_session_and_analyze(user_id: str, platform: str, session_start: datetime, telemetry_data: List[Dict] = None) -> Dict:
    """
    End a session and provide immediate analysis and recommendations.
    
    Args:
        user_id: User's ID
        platform: Platform used
        session_start: Session start datetime
        telemetry_data: List of telemetry records from the session
        
    Returns:
        Analysis report with insights and recommendations
    """
    db = SessionLocal()
    try:
        session_end = datetime.utcnow()
        session_duration_seconds = int((session_end - session_start).total_seconds())
        session_duration_minutes = session_duration_seconds / 60
        
        print(f"🛑 Session ended for {user_id} on {platform}. Duration: {session_duration_minutes:.1f} minutes")
        
        # Get all telemetry records from this session
        telemetry_records = db.query(ScrollTelemetryRecord).filter(
            and_(
                ScrollTelemetryRecord.user_id == user_id,
                ScrollTelemetryRecord.recorded_at >= session_start,
                ScrollTelemetryRecord.recorded_at <= session_end
            )
        ).all()
        
        # Calculate session metrics
        if telemetry_records:
            total_records = len(telemetry_records)
            avg_scroll_velocity = sum(t.scroll_velocity for t in telemetry_records) / total_records
            total_posts_bypassed = sum(t.posts_bypassed for t in telemetry_records)
            avg_dwell_time = sum(t.dwell_time_avg for t in telemetry_records) / total_records
            total_clicks = sum(t.clicks for t in telemetry_records)
            triggered_interventions = len([t for t in telemetry_records if t.intervention_triggered])
            avg_mindless_score = sum(t.mindless_score for t in telemetry_records) / total_records
        else:
            total_records = 0
            avg_scroll_velocity = 0
            total_posts_bypassed = 0
            avg_dwell_time = 0
            total_clicks = 0
            triggered_interventions = 0
            avg_mindless_score = 0
        
        # Calculate engagement metrics
        posts_per_minute = total_posts_bypassed / max(session_duration_minutes, 1)
        clicks_per_minute = total_clicks / max(session_duration_minutes, 1)
        
        # Store session metrics in database
        session_metrics = SessionMetrics(
            user_id=user_id,
            session_start=session_start,
            session_end=session_end,
            platform=platform,
            total_duration_seconds=session_duration_seconds,
            scroll_count=total_records,
            avg_scroll_velocity=avg_scroll_velocity,
            posts_viewed=total_posts_bypassed,
            posts_bypassed=total_posts_bypassed,
            avg_dwell_time=avg_dwell_time,
            click_count=total_clicks,
            interventions_received=triggered_interventions,
            mindless_score=avg_mindless_score,
            focus_score=max(0, 100 - avg_mindless_score)  # Inverse of mindless
        )
        db.add(session_metrics)
        db.commit()
        
        # Generate analysis and recommendations
        analysis = generate_session_analysis(
            session_duration_minutes=session_duration_minutes,
            avg_scroll_velocity=avg_scroll_velocity,
            total_posts_bypassed=total_posts_bypassed,
            avg_dwell_time=avg_dwell_time,
            total_clicks=total_clicks,
            triggered_interventions=triggered_interventions,
            avg_mindless_score=avg_mindless_score,
            posts_per_minute=posts_per_minute,
            clicks_per_minute=clicks_per_minute,
            platform=platform
        )
        
        print(f"📊 Session analysis complete for {user_id}")
        
        return {
            "session_end": session_end.isoformat(),
            "duration_minutes": round(session_duration_minutes, 1),
            "duration_seconds": session_duration_seconds,
            "platform": platform,
            "metrics": {
                "total_posts_viewed": total_posts_bypassed,
                "avg_scroll_velocity": round(avg_scroll_velocity, 2),
                "avg_dwell_time": round(avg_dwell_time, 2),
                "total_clicks": total_clicks,
                "interventions_triggered": triggered_interventions,
                "avg_mindless_score": round(avg_mindless_score, 1),
                "posts_per_minute": round(posts_per_minute, 1),
                "clicks_per_minute": round(clicks_per_minute, 1)
            },
            "analysis": analysis
        }
    except Exception as e:
        print(f"❌ Error ending session: {e}")
        raise
    finally:
        db.close()

def generate_session_analysis(session_duration_minutes: float, avg_scroll_velocity: float, 
                             total_posts_bypassed: int, avg_dwell_time: float, total_clicks: int,
                             triggered_interventions: int, avg_mindless_score: float, 
                             posts_per_minute: float, clicks_per_minute: float, platform: str) -> Dict:
    """
    Generate actionable insights and recommendations for the user.
    
    Returns:
        Analysis with insights, rating, and recommendations
    """
    insights = []
    recommendations = []
    overall_score = 0  # 0-100, higher is better (more mindful)
    
    # Analyze session duration
    if session_duration_minutes < 5:
        insights.append({
            "category": "Duration",
            "message": "✅ Great! Short, focused session.",
            "icon": "✓"
        })
        overall_score += 20
    elif session_duration_minutes < 15:
        insights.append({
            "category": "Duration",
            "message": f"⏱️ Session lasted {session_duration_minutes:.0f} minutes. Consider shorter browsing windows.",
            "icon": "ℹ"
        })
        overall_score += 15
        recommendations.append({
            "priority": "high",
            "tip": "Try limiting social media sessions to 5-10 minutes",
            "benefit": "Reduces dopamine spikes and maintains focus"
        })
    elif session_duration_minutes < 30:
        insights.append({
            "category": "Duration",
            "message": f"⚠️ Extended session: {session_duration_minutes:.0f} minutes. Time to take a break!",
            "icon": "⚠"
        })
        overall_score += 5
        recommendations.append({
            "priority": "critical",
            "tip": "Set a timer for 10 minutes max per browsing session",
            "benefit": "Prevents habit formation and reduces eye strain"
        })
    else:
        insights.append({
            "category": "Duration",
            "message": f"🚨 Very long session: {session_duration_minutes:.0f} minutes! This exceeds healthy limits.",
            "icon": "🚨"
        })
        overall_score += 0
        recommendations.append({
            "priority": "critical",
            "tip": "URGENT: Take a 15-minute break away from screens",
            "benefit": "Prevents addiction patterns and protects mental health"
        })
    
    # Analyze scroll velocity (pixels/sec)
    if avg_scroll_velocity < 100:
        insights.append({
            "category": "Scroll Speed",
            "message": "✅ Healthy scroll speed - you're taking time to view content",
            "icon": "✓"
        })
        overall_score += 15
    elif avg_scroll_velocity < 200:
        insights.append({
            "category": "Scroll Speed",
            "message": f"⚠️ Moderate scroll speed ({avg_scroll_velocity:.0f} px/s) - could indicate skimming",
            "icon": "ℹ"
        })
        overall_score += 10
        recommendations.append({
            "priority": "medium",
            "tip": "Slow down and engage with less content more deeply",
            "benefit": "Improves retention and reduces anxiety"
        })
    else:
        insights.append({
            "category": "Scroll Speed",
            "message": f"🔴 Very fast scrolling ({avg_scroll_velocity:.0f} px/s) - classic doomscrolling pattern",
            "icon": "🔴"
        })
        overall_score += 0
        recommendations.append({
            "priority": "critical",
            "tip": "Consciously slow down when scrolling - read full posts before moving on",
            "benefit": "Breaks doomscrolling habit and improves content comprehension"
        })
    
    # Analyze dwell time (seconds per post)
    if avg_dwell_time < 5:
        insights.append({
            "category": "Content Engagement",
            "message": f"🔴 Very low dwell time ({avg_dwell_time:.1f}s) - you're skipping content rapidly",
            "icon": "🔴"
        })
        overall_score += 0
        recommendations.append({
            "priority": "high",
            "tip": "Spend at least 10-15 seconds reading each post before scrolling",
            "benefit": "Allows your brain to actually process information"
        })
    elif avg_dwell_time < 10:
        insights.append({
            "category": "Content Engagement",
            "message": f"⚠️ Low dwell time ({avg_dwell_time:.1f}s) - rushing through content",
            "icon": "⚠"
        })
        overall_score += 8
        recommendations.append({
            "priority": "medium",
            "tip": "Pause and read posts fully instead of quick scrolling",
            "benefit": "Increases content meaningfulness and reduces endless loop feeling"
        })
    else:
        insights.append({
            "category": "Content Engagement",
            "message": f"✅ Good dwell time ({avg_dwell_time:.1f}s) - taking time with content",
            "icon": "✓"
        })
        overall_score += 20
    
    # Analyze interventions triggered
    if triggered_interventions == 0:
        insights.append({
            "category": "Behavior Pattern",
            "message": "✅ No interventions needed - excellent browsing behavior!",
            "icon": "✓"
        })
        overall_score += 20
    elif triggered_interventions < 3:
        insights.append({
            "category": "Behavior Pattern",
            "message": f"⚠️ {triggered_interventions} interventions triggered - some doomscrolling detected",
            "icon": "⚠"
        })
        overall_score += 10
        recommendations.append({
            "priority": "medium",
            "tip": "When you get an intervention, genuinely consider if you need to be here",
            "benefit": "Each intervention is a chance to reset your focus"
        })
    else:
        insights.append({
            "category": "Behavior Pattern",
            "message": f"🔴 {triggered_interventions} interventions triggered - heavy doomscrolling detected",
            "icon": "🔴"
        })
        overall_score += 0
        recommendations.append({
            "priority": "critical",
            "tip": "Stop immediately when intervention appears - it's your brain telling you to take a break",
            "benefit": "Short-term discomfort prevents long-term addiction"
        })
    
    # Analyze mindless score trend
    if avg_mindless_score < 30:
        insights.append({
            "category": "Mindfulness",
            "message": f"✅ Very mindful browsing ({avg_mindless_score:.0f}% mindless score)",
            "icon": "✓"
        })
        overall_score += 15
    elif avg_mindless_score < 60:
        insights.append({
            "category": "Mindfulness",
            "message": f"⚠️ Moderate mindlessness ({avg_mindless_score:.0f}% score) - some autopilot detected",
            "icon": "ℹ"
        })
        overall_score += 10
        recommendations.append({
            "priority": "medium",
            "tip": "Set an intention before opening the app - know what you want to see",
            "benefit": "Converts passive scrolling to active browsing"
        })
    else:
        insights.append({
            "category": "Mindfulness",
            "message": f"🔴 High mindlessness ({avg_mindless_score:.0f}% score) - mostly autopilot scrolling",
            "icon": "🔴"
        })
        overall_score += 0
        recommendations.append({
            "priority": "critical",
            "tip": "Use a physical timer - close app when timer goes off, no exceptions",
            "benefit": "External constraint breaks the autopilot loop"
        })
    
    # Sort recommendations by priority
    priority_order = {"critical": 0, "high": 1, "medium": 2}
    recommendations.sort(key=lambda x: priority_order.get(x["priority"], 3))
    
    # Cap overall score at 100
    overall_score = min(100, max(0, overall_score))
    
    # Determine session rating
    if overall_score >= 80:
        rating = "Excellent"
        emoji = "🌟"
    elif overall_score >= 60:
        rating = "Good"
        emoji = "👍"
    elif overall_score >= 40:
        rating = "Fair"
        emoji = "⚖️"
    else:
        rating = "Poor"
        emoji = "⛔"
    
    return {
        "overall_score": overall_score,
        "rating": f"{emoji} {rating}",
        "insights": insights,
        "recommendations": recommendations,
        "action_items": [f"[{rec['priority'].upper()}] {rec['tip']}" for rec in recommendations[:3]]
    }

def check_extended_usage_warning(user_id: str, session_start: datetime) -> Optional[Dict]:
    """
    Check if user has exceeded 30-minute continuous usage.
    Returns warning if threshold exceeded.
    
    Args:
        user_id: User's ID
        session_start: When session started
        
    Returns:
        Warning dict if 30+ minutes, None otherwise
    """
    elapsed_minutes = (datetime.utcnow() - session_start).total_seconds() / 60
    
    if elapsed_minutes >= 30:
        print(f"⚠️ EXTENDED USAGE WARNING: {user_id} has been browsing for {elapsed_minutes:.0f} minutes")
        
        return {
            "warning": True,
            "elapsed_minutes": round(elapsed_minutes, 0),
            "elapsed_seconds": int((datetime.utcnow() - session_start).total_seconds()),
            "message": f"⚠️ You've been scrolling for {elapsed_minutes:.0f} minutes!",
            "recommendation": "Take a break and step away from the screen",
            "severity": "critical" if elapsed_minutes >= 60 else "high",
            "time_exceeded_by_minutes": round(elapsed_minutes - 30, 0)
        }
    
    return None

def get_session_history(user_id: str, days: int = 7) -> List[Dict]:
    """
    Get user's session history for past N days.
    
    Args:
        user_id: User's ID
        days: Number of days to look back
        
    Returns:
        List of sessions with metrics
    """
    db = SessionLocal()
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        sessions = db.query(SessionMetrics).filter(
            and_(
                SessionMetrics.user_id == user_id,
                SessionMetrics.session_start >= start_date
            )
        ).order_by(SessionMetrics.session_start.desc()).all()
        
        return [
            {
                "date": s.session_start.date().isoformat(),
                "time": s.session_start.time().isoformat(),
                "duration_minutes": round(s.total_duration_seconds / 60, 1),
                "platform": s.platform,
                "mindless_score": round(s.mindless_score, 1),
                "focus_score": round(s.focus_score, 1),
                "interventions": s.interventions_received,
                "posts_viewed": s.posts_viewed
            }
            for s in sessions
        ]
    finally:
        db.close()
