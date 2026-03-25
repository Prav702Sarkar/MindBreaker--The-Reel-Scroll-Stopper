"""
Service to aggregate raw telemetry into daily statistics for dashboard graphing.
This bridges raw telemetry records into meaningful trend data.
"""

from datetime import date, datetime, timedelta
from sqlalchemy import and_, func
from db_models import ScrollTelemetryRecord, DailyStats, Intervention, User
from database import SessionLocal
from typing import Optional

def aggregate_daily_stats(user_id: str, target_date: Optional[date] = None) -> DailyStats:
    """
    Aggregate raw telemetry into daily statistics.
    Call this after each telemetry record is added.
    
    Args:
        user_id: User's ID
        target_date: Date to aggregate (default: today)
        
    Returns:
        Updated DailyStats record
    """
    db = SessionLocal()
    try:
        if target_date is None:
            target_date = date.today()
        
        print(f"📊 Aggregating stats for {user_id} on {target_date}")
        
        # Get all telemetry records for this user on this date
        telemetry_records = db.query(ScrollTelemetryRecord).filter(
            and_(
                ScrollTelemetryRecord.user_id == user_id,
                ScrollTelemetryRecord.date == target_date
            )
        ).all()
        
        # Get all interventions for this user on this date (to calculate success rate)
        interventions = db.query(Intervention).filter(
            and_(
                Intervention.user_id == user_id,
                Intervention.date == target_date
            )
        ).all()
        
        # Calculate aggregated metrics
        if telemetry_records:
            total_sessions = len(telemetry_records)
            total_scroll_velocity = sum(t.scroll_velocity for t in telemetry_records)
            avg_scroll_velocity = total_scroll_velocity / total_sessions if total_sessions > 0 else 0.0
            total_posts_bypassed = sum(t.posts_bypassed for t in telemetry_records)
            avg_dwell_time = sum(t.dwell_time_avg for t in telemetry_records) / total_sessions if total_sessions > 0 else 0.0
            total_clicks = sum(t.clicks for t in telemetry_records)
            avg_mindless_score = sum(t.mindless_score for t in telemetry_records) / total_sessions if total_sessions > 0 else 0.0
        else:
            total_sessions = 0
            total_scroll_velocity = 0.0
            avg_scroll_velocity = 0.0
            total_posts_bypassed = 0
            avg_dwell_time = 0.0
            total_clicks = 0
            avg_mindless_score = 0.0
        
        # Count interventions for today
        intervention_count = len(interventions)
        
        # Calculate intervention success rate
        # Success = user acknowledged intervention (or we assume success if they didn't trigger more in next 5 mins)
        # For now: simple heuristic - if triggering many interventions, success rate is low
        if intervention_count > 0:
            # Count how many interventions had interventions_triggered=True in telemetry
            triggered_count = len([t for t in telemetry_records if t.intervention_triggered])
            intervention_success_rate = max(0, 100 - (triggered_count / max(1, intervention_count) * 100))
        else:
            intervention_success_rate = 100.0  # Perfect score if no interventions needed
        
        # Calculate time reclaimed (time user spent scrolling vs scrolling mindfully)
        # Heuristic: Each intervention prevented ~2 minutes of unproductive scrolling
        time_reclaimed_minutes = intervention_count * 2.0
        
        # Check if DailyStats already exists for this day
        existing_stats = db.query(DailyStats).filter(
            and_(
                DailyStats.user_id == user_id,
                DailyStats.date == target_date
            )
        ).first()
        
        if existing_stats:
            # Update existing record
            print(f"🔄 Updating existing daily stats for {user_id} on {target_date}")
            existing_stats.total_sessions = total_sessions
            existing_stats.total_scroll_velocity = total_scroll_velocity
            existing_stats.avg_scroll_velocity = avg_scroll_velocity
            existing_stats.total_posts_bypassed = total_posts_bypassed
            existing_stats.avg_dwell_time = avg_dwell_time
            existing_stats.total_clicks = total_clicks
            existing_stats.intervention_count = intervention_count
            existing_stats.intervention_success_rate = intervention_success_rate
            existing_stats.avg_mindless_score = avg_mindless_score
            existing_stats.time_reclaimed_minutes = time_reclaimed_minutes
            existing_stats.computed_at = datetime.utcnow()
            db.commit()
            stats = existing_stats
        else:
            # Create new record
            print(f"📝 Creating new daily stats for {user_id} on {target_date}")
            stats = DailyStats(
                user_id=user_id,
                date=target_date,
                total_sessions=total_sessions,
                total_scroll_velocity=total_scroll_velocity,
                avg_scroll_velocity=avg_scroll_velocity,
                total_posts_bypassed=total_posts_bypassed,
                avg_dwell_time=avg_dwell_time,
                total_clicks=total_clicks,
                intervention_count=intervention_count,
                intervention_success_rate=intervention_success_rate,
                avg_mindless_score=avg_mindless_score,
                time_reclaimed_minutes=time_reclaimed_minutes,
                computed_at=datetime.utcnow()
            )
            db.add(stats)
            db.commit()
        
        print(f"✅ Daily stats aggregated: {total_sessions} sessions, {intervention_count} interventions, "
              f"avg_velocity={avg_scroll_velocity:.2f} px/s, success_rate={intervention_success_rate:.1f}%")
        
        db.refresh(stats)
        return stats
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error aggregating stats: {e}")
        raise
    finally:
        db.close()

def aggregate_weekly_stats(user_id: str, days_back: int = 7) -> dict:
    """
    Get aggregated stats for past N days for weekly view.
    
    Args:
        user_id: User's ID
        days_back: Number of days to aggregate (default: 7)
        
    Returns:
        Dictionary with stats for each day
    """
    db = SessionLocal()
    try:
        start_date = date.today() - timedelta(days=days_back)
        
        daily_stats = db.query(DailyStats).filter(
            and_(
                DailyStats.user_id == user_id,
                DailyStats.date >= start_date
            )
        ).order_by(DailyStats.date).all()
        
        return {
            "user_id": user_id,
            "period": f"{days_back}_days",
            "start_date": str(start_date),
            "end_date": str(date.today()),
            "stats": [
                {
                    "date": str(s.date),
                    "avg_velocity": s.avg_scroll_velocity,
                    "intervention_count": s.intervention_count,
                    "success_rate": s.intervention_success_rate,
                    "time_reclaimed_minutes": s.time_reclaimed_minutes,
                    "avg_mindless_score": s.avg_mindless_score,
                    "total_sessions": s.total_sessions,
                    "avg_dwell_time": s.avg_dwell_time,
                    "total_posts_bypassed": s.total_posts_bypassed,
                }
                for s in daily_stats
            ]
        }
    finally:
        db.close()

def calculate_user_insights(user_id: str) -> dict:
    """
    Calculate high-level insights for a user based on historical data.
    
    Returns:
        Dictionary with key metrics and trends
    """
    db = SessionLocal()
    try:
        # Get stats for past 30 days
        thirty_days_ago = date.today() - timedelta(days=30)
        stats = db.query(DailyStats).filter(
            and_(
                DailyStats.user_id == user_id,
                DailyStats.date >= thirty_days_ago
            )
        ).all()
        
        if not stats:
            return {
                "user_id": user_id,
                "total_interventions": 0,
                "avg_success_rate": 0.0,
                "total_time_reclaimed_minutes": 0.0,
                "avg_scroll_velocity": 0.0,
                "trend": "no_data"
            }
        
        total_interventions = sum(s.intervention_count for s in stats)
        avg_success_rate = sum(s.intervention_success_rate for s in stats) / len(stats)
        total_time_reclaimed = sum(s.time_reclaimed_minutes for s in stats)
        avg_velocity = sum(s.avg_scroll_velocity for s in stats) / len(stats)
        
        # Simple trend: compare first half vs second half
        mid = len(stats) // 2
        first_half_avg_velocity = sum(s.avg_scroll_velocity for s in stats[:mid]) / len(stats[:mid]) if mid > 0 else 0
        second_half_avg_velocity = sum(s.avg_scroll_velocity for s in stats[mid:]) / len(stats[mid:]) if len(stats) > mid else 0
        
        if first_half_avg_velocity > 0:
            velocity_improvement = ((first_half_avg_velocity - second_half_avg_velocity) / first_half_avg_velocity) * 100
        else:
            velocity_improvement = 0
        
        trend = "improving" if velocity_improvement > 5 else ("degrading" if velocity_improvement < -5 else "stable")
        
        return {
            "user_id": user_id,
            "total_interventions": total_interventions,
            "avg_success_rate": round(avg_success_rate, 1),
            "total_time_reclaimed_minutes": round(total_time_reclaimed, 1),
            "avg_scroll_velocity": round(avg_velocity, 2),
            "velocity_improvement_percent": round(velocity_improvement, 1),
            "trend": trend,
            "data_points": len(stats)
        }
    finally:
        db.close()
