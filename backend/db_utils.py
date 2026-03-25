"""
Database utilities for initialization and stats computation
"""
from datetime import date, datetime, timedelta
from sqlalchemy import and_, func
from db_models import (
    User, ScrollTelemetryRecord, Intervention, DailyStats, 
    UserProfile, SessionMetrics
)
from database import SessionLocal

def compute_daily_stats(user_id: str, target_date: date = None):
    """Compute and store daily statistics from telemetry"""
    db = SessionLocal()
    try:
        if target_date is None:
            target_date = date.today()
        
        # Get all telemetry for the day
        telemetry_records = db.query(ScrollTelemetryRecord).filter(
            and_(
                ScrollTelemetryRecord.user_id == user_id,
                ScrollTelemetryRecord.date == target_date
            )
        ).all()
        
        if not telemetry_records:
            return None
        
        # Calculate aggregated stats
        total_sessions = len(telemetry_records)
        total_velocity = sum(r.scroll_velocity for r in telemetry_records)
        avg_velocity = total_velocity / total_sessions if total_sessions else 0
        
        total_bypassed = sum(r.posts_bypassed for r in telemetry_records)
        avg_dwell = sum(r.dwell_time_avg for r in telemetry_records) / total_sessions if total_sessions else 0
        total_clicks = sum(r.clicks for r in telemetry_records)
        avg_mindless = sum(r.mindless_score for r in telemetry_records) / total_sessions if total_sessions else 0
        
        # Get intervention stats
        interventions = db.query(Intervention).filter(
            and_(
                Intervention.user_id == user_id,
                Intervention.date == target_date
            )
        ).all()
        
        intervention_count = len(interventions)
        acknowledged = sum(1 for i in interventions if i.user_acknowledged)
        success_rate = (acknowledged / intervention_count * 100) if intervention_count else 0
        
        # Estimate time reclaimed (rough calculation: interventions * 5 minutes avg)
        time_reclaimed = intervention_count * 5
        
        # Check if stats already exist for this day
        existing = db.query(DailyStats).filter(
            and_(
                DailyStats.user_id == user_id,
                DailyStats.date == target_date
            )
        ).first()
        
        if existing:
            # Update existing
            existing.total_sessions = total_sessions
            existing.total_scroll_velocity = total_velocity
            existing.avg_scroll_velocity = avg_velocity
            existing.total_posts_bypassed = total_bypassed
            existing.avg_dwell_time = avg_dwell
            existing.total_clicks = total_clicks
            existing.intervention_count = intervention_count
            existing.intervention_success_rate = success_rate
            existing.avg_mindless_score = avg_mindless
            existing.time_reclaimed_minutes = time_reclaimed
            existing.computed_at = datetime.utcnow()
        else:
            # Create new
            daily_stat = DailyStats(
                user_id=user_id,
                date=target_date,
                total_sessions=total_sessions,
                total_scroll_velocity=total_velocity,
                avg_scroll_velocity=avg_velocity,
                total_posts_bypassed=total_bypassed,
                avg_dwell_time=avg_dwell,
                total_clicks=total_clicks,
                intervention_count=intervention_count,
                intervention_success_rate=success_rate,
                avg_mindless_score=avg_mindless,
                time_reclaimed_minutes=time_reclaimed,
                computed_at=datetime.utcnow()
            )
            db.add(daily_stat)
        
        db.commit()
        print(f"✅ Daily stats computed for {user_id} on {target_date}")
        return existing or daily_stat
    finally:
        db.close()

def compute_all_daily_stats(user_id: str, days: int = 30):
    """Compute daily stats for the past N days"""
    for i in range(days):
        target_date = date.today() - timedelta(days=i)
        compute_daily_stats(user_id, target_date)

def generate_sample_user(user_id: str = "test_user_001"):
    """Generate a sample user with test data"""
    db = SessionLocal()
    try:
        # Create user
        user = User(
            id=user_id,
            email=f"{user_id}@test.com",
            full_name="Test User",
            first_name="Test",
            last_name="User"
        )
        db.add(user)
        db.flush()
        
        # Generate 7 days of sample telemetry
        for day_offset in range(7):
            target_date = date.today() - timedelta(days=day_offset)
            
            # Generate 10 sessions per day
            for session in range(10):
                import random
                
                scrolling_fast = random.choice([True, False])
                velocity = random.uniform(200, 500) if scrolling_fast else random.uniform(50, 150)
                posts = random.randint(5, 20) if scrolling_fast else random.randint(1, 5)
                dwell = random.uniform(0.5, 2.0) if scrolling_fast else random.uniform(3.0, 8.0)
                clicks = random.randint(1, 10)
                
                # Simple mindless score
                mindless = min(100, (velocity * 0.3 + posts * 2 + (10 - dwell) * 5) / 100.0 * 100)
                
                telemetry = ScrollTelemetryRecord(
                    user_id=user_id,
                    platform=random.choice(['Twitter', 'TikTok', 'Reddit', 'Instagram']),
                    scroll_velocity=velocity,
                    posts_bypassed=posts,
                    dwell_time_avg=dwell,
                    clicks=clicks,
                    mindless_score=mindless,
                    intervention_triggered=mindless > 75,
                    intervention_message="Looks like mindless scrolling!" if mindless > 75 else None,
                    recorded_at=datetime.utcnow(),
                    date=target_date
                )
                db.add(telemetry)
                
                # Create intervention for high mindless score
                if mindless > 75:
                    intervention = Intervention(
                        user_id=user_id,
                        triggered_at=datetime.utcnow(),
                        date=target_date,
                        mindless_score=mindless,
                        message="Take a breath and reconsider your intent",
                        user_acknowledged=random.choice([True, False])
                    )
                    db.add(intervention)
        
        db.commit()
        print(f"✅ Sample user '{user_id}' created with test data")
        
        # Compute daily stats
        compute_all_daily_stats(user_id, days=7)
        
    finally:
        db.close()

def clear_user_data(user_id: str):
    """Clear all data for a user"""
    db = SessionLocal()
    try:
        db.query(SessionMetrics).filter(SessionMetrics.user_id == user_id).delete()
        db.query(DailyStats).filter(DailyStats.user_id == user_id).delete()
        db.query(UserProfile).filter(UserProfile.user_id == user_id).delete()
        db.query(Intervention).filter(Intervention.user_id == user_id).delete()
        db.query(ScrollTelemetryRecord).filter(ScrollTelemetryRecord.user_id == user_id).delete()
        db.query(User).filter(User.id == user_id).delete()
        db.commit()
        print(f"✅ Cleared all data for user {user_id}")
    finally:
        db.close()

def get_database_summary():
    """Get summary statistics of the database"""
    db = SessionLocal()
    try:
        user_count = db.query(func.count(User.id)).scalar()
        telemetry_count = db.query(func.count(ScrollTelemetryRecord.id)).scalar()
        intervention_count = db.query(func.count(Intervention.id)).scalar()
        profile_count = db.query(func.count(UserProfile.id)).scalar()
        
        print(f"\n📊 Database Summary:")
        print(f"   Users: {user_count}")
        print(f"   Telemetry Records: {telemetry_count}")
        print(f"   Interventions: {intervention_count}")
        print(f"   Profiles: {profile_count}")
        print()
        
    finally:
        db.close()

if __name__ == "__main__":
    from database import init_db
    
    print("Initializing database...")
    init_db()
    
    print("\nGenerating sample data...")
    generate_sample_user("test_user_001")
    
    get_database_summary()
