from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from e_sus.core.database import get_db
from e_sus.modules.auth.dependencies import get_current_user, require_admin
from e_sus.modules.users.models import User

from .schemas import NotificationEventType, NotificationResponse, NotificationRuleResponse, NotificationRuleUpdate
from .service import NotificationService

notifications_router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _not_found(error: ValueError):
    raise HTTPException(status_code=404 if "não encontrada" in str(error).lower() else 409, detail=str(error)) from error


@notifications_router.get("/rules", response_model=list[NotificationRuleResponse], dependencies=[Depends(require_admin)])
def list_rules(db: Session = Depends(get_db)):
    return NotificationService(db).list_rules()


@notifications_router.patch("/rules/{event_type}", response_model=NotificationRuleResponse)
def update_rule(event_type: NotificationEventType, data: NotificationRuleUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return NotificationService(db).update_rule(event_type.value, data, admin.id)
    except ValueError as exc:
        _not_found(exc)


@notifications_router.get("/me", response_model=list[NotificationResponse])
def my_notifications(unread_only: bool = Query(default=False), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return NotificationService(db).inbox(user.id, unread_only)


@notifications_router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(notification_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return NotificationService(db).mark_read(user.id, notification_id)
    except ValueError as exc:
        _not_found(exc)
