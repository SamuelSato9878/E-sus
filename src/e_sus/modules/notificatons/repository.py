from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Notification, NotificationRule


class NotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def rules(self):
        return list(self.db.scalars(select(NotificationRule).order_by(NotificationRule.event_type)))

    def rule(self, event_type: str):
        return self.db.scalar(select(NotificationRule).where(NotificationRule.event_type == event_type))

    def inbox(self, user_id: int, now: datetime, unread_only: bool = False):
        statement = select(Notification).where(Notification.user_id == user_id, Notification.available_at <= now, Notification.is_cancelled.is_(False))
        if unread_only:
            statement = statement.where(Notification.read_at.is_(None))
        return list(self.db.scalars(statement.order_by(Notification.available_at.desc(), Notification.id.desc())))

    def get_for_user(self, notification_id: int, user_id: int):
        return self.db.scalar(select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id))
