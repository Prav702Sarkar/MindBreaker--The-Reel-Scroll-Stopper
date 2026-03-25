from typing import List
from datetime import datetime, date
from sqlalchemy import and_, desc
from models import ScrollTelemetry
from db_models import ScrollTelemetryRecord, DailyStats, User
from database import SessionLocal
from utils.helpers import get_today_str

def add_telemetry(user_id: str, telemetry: ScrollTelemetry, mindless_score: float = 0.0, intervention_triggered: bool = False, intervention_message: str = None) -> ScrollTelemetryRecord:
    """Add a telemetry record to the database"""
    db = SessionLocal()
    try:
        # Ensure user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            user = User(id=user_id, email=f"{user_id}@mindbreaker.local")
            db.add(user)
            db.flush()
        
        # Create telemetry record
        record = ScrollTelemetryRecord(
            user_id=user_id,
            platform=telemetry.platform,
            scroll_velocity=telemetry.scroll_velocity,
            posts_bypassed=telemetry.posts_bypassed,
            dwell_time_avg=telemetry.dwell_time_avg,
            clicks=telemetry.clicks,
            mindless_score=mindless_score,
            intervention_triggered=intervention_triggered,
            intervention_message=intervention_message,
            recorded_at=datetime.utcnow(),
            date=date.today()
        )
        db.add(record)
        db.commit()
        return record
    finally:
        db.close()

def get_today_telemetry(user_id: str) -> List[ScrollTelemetry]:
    """Get all telemetry records for today"""
    db = SessionLocal()
    try:
        today = date.today()
        records = db.query(ScrollTelemetryRecord).filter(
            and_(
                ScrollTelemetryRecord.user_id == user_id,
                ScrollTelemetryRecord.date == today
            )
        ).order_by(ScrollTelemetryRecord.recorded_at).all()
        
        # Convert to Pydantic models
        return [
            ScrollTelemetry(
                user_id=r.user_id,
                platform=r.platform,
                scroll_velocity=r.scroll_velocity,
                posts_bypassed=r.posts_bypassed,
                dwell_time_avg=r.dwell_time_avg,
                clicks=r.clicks
            )
            for r in records
        ]
    finally:
        db.close()

def get_weekly_telemetry(user_id: str, days: int = 7) -> List[ScrollTelemetryRecord]:
    """Get telemetry records for the past N days"""
    db = SessionLocal()
    try:
        from datetime import timedelta
        start_date = date.today() - timedelta(days=days)
        records = db.query(ScrollTelemetryRecord).filter(
            and_(
                ScrollTelemetryRecord.user_id == user_id,
                ScrollTelemetryRecord.date >= start_date
            )
        ).order_by(desc(ScrollTelemetryRecord.recorded_at)).all()
        return records
    finally:
        db.close()

def get_platform_stats(user_id: str, platform: str = None, days: int = 7) -> dict:
    """Get statistics grouped by platform or for a specific platform"""
    db = SessionLocal()
    try:
        from datetime import timedelta
        start_date = date.today() - timedelta(days=days)
        
        query = db.query(ScrollTelemetryRecord).filter(
            and_(
                ScrollTelemetryRecord.user_id == user_id,
                ScrollTelemetryRecord.date >= start_date
            )
        )
        
        if platform:
            query = query.filter(ScrollTelemetryRecord.platform == platform)
        
        records = query.all()
        
        if not records:
            return {}
        
        # Aggregate stats by platform
        stats = {}
        for record in records:
            p = record.platform
            if p not in stats:
                stats[p] = {
                    'count': 0,
                    'avg_velocity': 0,
                    'total_bypassed': 0,
                    'avg_dwell': 0,
                    'total_clicks': 0,
                    'interventions': 0
                }
            
            stats[p]['count'] += 1
            stats[p]['total_bypassed'] += record.posts_bypassed
            stats[p]['total_clicks'] += record.clicks
            if record.intervention_triggered:
                stats[p]['interventions'] += 1
        
        # Calculate averages
        for p in stats:
            count = stats[p]['count']
            stats[p]['avg_velocity'] = sum(r.scroll_velocity for r in records if r.platform == p) / count
            stats[p]['avg_dwell'] = sum(r.dwell_time_avg for r in records if r.platform == p) / count
        
        return stats
    finally:
        db.close()