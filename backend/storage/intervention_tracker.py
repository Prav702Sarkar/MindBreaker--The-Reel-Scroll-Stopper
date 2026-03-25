from datetime import date, datetime
from sqlalchemy import and_, func
from db_models import Intervention, User
from database import SessionLocal

def get_intervention_count(user_id: str) -> int:
    """Get the number of interventions for today"""
    db = SessionLocal()
    try:
        today = date.today()
        count = db.query(func.count(Intervention.id)).filter(
            and_(
                Intervention.user_id == user_id,
                Intervention.date == today
            )
        ).scalar()
        return count or 0
    finally:
        db.close()

def increment_intervention_count(user_id: str, mindless_score: float, message: str) -> int:
    """
    Log an intervention and return the new count for today
    """
    db = SessionLocal()
    try:
        # Ensure user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            user = User(id=user_id, email=f"{user_id}@mindbreaker.local")
            db.add(user)
            db.flush()
        
        # Create intervention record
        intervention = Intervention(
            user_id=user_id,
            triggered_at=datetime.utcnow(),
            date=date.today(),
            mindless_score=mindless_score,
            message=message,
            user_acknowledged=False
        )
        db.add(intervention)
        db.commit()
        
        # Get new count for today
        today = date.today()
        count = db.query(func.count(Intervention.id)).filter(
            and_(
                Intervention.user_id == user_id,
                Intervention.date == today
            )
        ).scalar()
        
        return count or 0
    finally:
        db.close()

def get_interventions_for_period(user_id: str, days: int = 7) -> list:
    """Get all interventions for the past N days"""
    db = SessionLocal()
    try:
        from datetime import timedelta
        start_date = date.today() - timedelta(days=days)
        
        interventions = db.query(Intervention).filter(
            and_(
                Intervention.user_id == user_id,
                Intervention.date >= start_date
            )
        ).order_by(Intervention.triggered_at.desc()).all()
        
        return interventions
    finally:
        db.close()

def get_intervention_success_rate(user_id: str, days: int = 7) -> float:
    """Calculate intervention success rate (acknowledged/total)"""
    db = SessionLocal()
    try:
        from datetime import timedelta
        start_date = date.today() - timedelta(days=days)
        
        total = db.query(func.count(Intervention.id)).filter(
            and_(
                Intervention.user_id == user_id,
                Intervention.date >= start_date
            )
        ).scalar()
        
        acknowledged = db.query(func.count(Intervention.id)).filter(
            and_(
                Intervention.user_id == user_id,
                Intervention.date >= start_date,
                Intervention.user_acknowledged == True
            )
        ).scalar()
        
        if not total or total == 0:
            return 0.0
        
        return (acknowledged / total) * 100
    finally:
        db.close()