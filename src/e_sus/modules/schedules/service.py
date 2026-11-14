from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from e_sus.modules.professional.models import Professional
from e_sus.modules.users.models import User

from .models import Schedule, ScheduleBlock, ScheduleDay, ScheduleException, ScheduleExceptionPeriod, SchedulePeriod
from .repository import ScheduleRepository
from .schemas import BlockCreate, BlockUpdate, ExceptionCreate, ExceptionUpdate, ScheduleCreate, ScheduleDayInput, ScheduleUpdate, resolve_timezone, validate_periods


class ScheduleService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ScheduleRepository(db)

    def create_schedule(self, professional_id: int, data: ScheduleCreate):
        self._professional(professional_id)
        self._ensure_no_schedule_conflict(professional_id, data.valid_from, data.valid_until)
        try:
            schedule = Schedule(professional_id=professional_id, **data.model_dump())
            self.repo.save(schedule)
            return self.repo.get_schedule(schedule.id)
        except Exception:
            self.db.rollback()
            raise

    def list_schedules(self, professional_id: int):
        self._professional(professional_id)
        return self.repo.schedules_for_professional(professional_id)

    def get_schedule(self, schedule_id: int):
        result = self.repo.get_schedule(schedule_id)
        if result is None:
            raise ValueError("Escala não encontrada.")
        return result

    def update_schedule(self, schedule_id: int, data: ScheduleUpdate):
        schedule = self.get_schedule(schedule_id)
        changes = data.model_dump(exclude_unset=True)
        valid_from = changes.get("valid_from", schedule.valid_from)
        valid_until = changes.get("valid_until", schedule.valid_until)
        if valid_until and valid_until < valid_from:
            raise ValueError("Término da vigência deve ser posterior ao início.")
        if changes.get("is_active", schedule.is_active):
            self._ensure_no_schedule_conflict(schedule.professional_id, valid_from, valid_until, schedule.id)
        for key, value in changes.items():
            if value is not None or key == "valid_until":
                setattr(schedule, key, value)
        self.db.commit()
        return self.get_schedule(schedule_id)

    def set_day(self, schedule_id: int, weekday: int, data: ScheduleDayInput):
        if weekday < 0 or weekday > 6:
            raise ValueError("Dia da semana deve estar entre 0 e 6.")
        schedule = self.get_schedule(schedule_id)
        try:
            day = next((item for item in schedule.days if item.weekday == weekday), None)
            if day is None:
                day = ScheduleDay(schedule_id=schedule.id, weekday=weekday)
                self.db.add(day)
            day.is_active = data.is_active
            day.periods.clear()
            self.db.flush()
            day.periods.extend(SchedulePeriod(start_time=p.start_time, end_time=p.end_time) for p in validate_periods(data.periods))
            self.db.commit()
            return self.get_schedule(schedule_id)
        except Exception:
            self.db.rollback()
            raise

    def copy_days(self, schedule_id: int, source_weekday: int, target_weekdays: list[int]):
        schedule = self.get_schedule(schedule_id)
        source = next((day for day in schedule.days if day.weekday == source_weekday), None)
        if source is None:
            raise ValueError("Dia de origem não configurado.")
        if source_weekday in target_weekdays:
            raise ValueError("Dia de origem não pode constar entre os dias alvo.")
        try:
            for weekday in target_weekdays:
                target = next((day for day in schedule.days if day.weekday == weekday), None)
                if target is None:
                    target = ScheduleDay(schedule_id=schedule.id, weekday=weekday)
                    self.db.add(target)
                    self.db.flush()
                target.is_active = source.is_active
                target.periods.clear()
                target.periods.extend(SchedulePeriod(start_time=p.start_time, end_time=p.end_time) for p in source.periods)
            self.db.commit()
            return self.get_schedule(schedule_id)
        except Exception:
            self.db.rollback()
            raise

    def replicate(self, schedule_id: int, professional_ids: list[int]):
        source = self.get_schedule(schedule_id)
        if len(professional_ids) != len(set(professional_ids)) or source.professional_id in professional_ids:
            raise ValueError("Profissionais alvo devem ser únicos e diferentes da origem.")
        try:
            created = []
            for professional_id in professional_ids:
                self._professional(professional_id)
                self._ensure_no_schedule_conflict(professional_id, source.valid_from, source.valid_until)
                target = Schedule(professional_id=professional_id, valid_from=source.valid_from, valid_until=source.valid_until, timezone_name=source.timezone_name, is_active=source.is_active)
                self.db.add(target)
                self.db.flush()
                for source_day in source.days:
                    target_day = ScheduleDay(weekday=source_day.weekday, is_active=source_day.is_active)
                    target.days.append(target_day)
                    target_day.periods.extend(SchedulePeriod(start_time=p.start_time, end_time=p.end_time) for p in source_day.periods)
                created.append(target)
            self.db.commit()
            return created
        except Exception:
            self.db.rollback()
            raise

    def create_exception(self, professional_id: int, data: ExceptionCreate, user: User):
        self._professional(professional_id)
        try:
            exception = ScheduleException(professional_id=professional_id, exception_date=data.exception_date, mode=data.mode, reason=data.reason, created_by_user_id=user.id)
            exception.periods.extend(ScheduleExceptionPeriod(start_time=p.start_time, end_time=p.end_time) for p in data.periods)
            self.db.add(exception)
            self.db.commit()
            self.db.refresh(exception)
            return exception
        except Exception:
            self.db.rollback()
            raise

    def list_exceptions(self, professional_id: int):
        self._professional(professional_id)
        return self.repo.exceptions(professional_id)

    def deactivate_exception(self, exception_id: int):
        exception = self.db.get(ScheduleException, exception_id)
        if exception is None:
            raise ValueError("Exceção não encontrada.")
        exception.is_active = False
        self.db.commit()
        return exception

    def update_exception(self, exception_id: int, data: ExceptionUpdate):
        exception = self.db.get(ScheduleException, exception_id)
        if exception is None:
            raise ValueError("Exceção não encontrada.")
        changes = data.model_dump(exclude_unset=True)
        # model_dump() converts nested PeriodInput instances to dictionaries.
        # Keep the validated schema objects here so their fields can be read
        # while rebuilding the ORM relationship.
        periods = data.periods if "periods" in changes else None
        changes.pop("periods", None)
        mode = changes.get("mode", exception.mode)
        effective_periods = periods if periods is not None else exception.periods
        if mode == "REPLACE" and not effective_periods:
            raise ValueError("Exceção REPLACE exige pelo menos um período.")
        if mode == "CLOSED" and effective_periods:
            raise ValueError("Exceção CLOSED não pode possuir períodos.")
        try:
            if periods is not None:
                exception.periods.clear()
                exception.periods.extend(
                    ScheduleExceptionPeriod(start_time=p.start_time, end_time=p.end_time)
                    for p in periods
                )
            for field, value in changes.items():
                if value is not None or field == "reason":
                    setattr(exception, field, value)
            self.db.commit()
            self.db.refresh(exception)
            return exception
        except Exception:
            self.db.rollback()
            raise

    def create_block(self, professional_id: int, data: BlockCreate, user: User):
        self._professional(professional_id)
        block = ScheduleBlock(professional_id=professional_id, start_at=data.start_at.astimezone(timezone.utc), end_at=data.end_at.astimezone(timezone.utc), reason=data.reason.strip(), created_by_user_id=user.id)
        self.db.add(block)
        self.db.commit()
        self.db.refresh(block)
        return block

    def list_blocks(self, professional_id: int):
        self._professional(professional_id)
        return self.repo.list_blocks(professional_id)

    def deactivate_block(self, block_id: int):
        block = self.db.get(ScheduleBlock, block_id)
        if block is None:
            raise ValueError("Bloqueio não encontrado.")
        block.is_active = False
        self.db.commit()
        return block

    def update_block(self, block_id: int, data: BlockUpdate):
        block = self.db.get(ScheduleBlock, block_id)
        if block is None:
            raise ValueError("Bloqueio não encontrado.")
        changes = data.model_dump(exclude_unset=True)
        start = changes.get("start_at", block.start_at)
        end = changes.get("end_at", block.end_at)
        if start.tzinfo is None or end.tzinfo is None:
            # SQLite may return naive timestamps for values originally stored with UTC.
            start = start.replace(tzinfo=timezone.utc) if start.tzinfo is None else start
            end = end.replace(tzinfo=timezone.utc) if end.tzinfo is None else end
        if end <= start:
            raise ValueError("Término do bloqueio deve ser posterior ao início.")
        for field, value in changes.items():
            if field in {"start_at", "end_at"} and value is not None:
                value = value.astimezone(timezone.utc)
            if value is not None or field == "reason":
                setattr(block, field, value.strip() if field == "reason" else value)
        self.db.commit()
        self.db.refresh(block)
        return block

    def availability_days(self, professional_id: int, service_id: int, start: date, end: date):
        service = self._availability_context(professional_id, service_id)
        result = []
        day = start
        while day <= end:
            schedule = self._schedule_for_date(professional_id, day)
            if schedule and self._windows_for_day(professional_id, service, schedule, day):
                result.append(day)
            day += timedelta(days=1)
        return result

    def availability(self, professional_id: int, service_id: int, day: date):
        service = self._availability_context(professional_id, service_id)
        schedule = self._schedule_for_date(professional_id, day)
        if schedule is None:
            raise ValueError("Escala ativa não encontrada para a data informada.")
        windows = self._windows_for_day(professional_id, service, schedule, day)
        return {"professional_id": professional_id, "professional_name": schedule.professional.name, "service_id": service_id, "date": day, "timezone_name": schedule.timezone_name, "windows": windows, "reservation_ready": True, "pending_validation": None}

    def local_date_for_datetime(self, professional_id: int, value: datetime) -> date:
        instant = value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value
        for schedule in self.repo.schedules_for_professional(professional_id):
            local_day = instant.astimezone(resolve_timezone(schedule.timezone_name)).date()
            if schedule.is_active and schedule.valid_from <= local_day and (schedule.valid_until is None or schedule.valid_until >= local_day):
                return local_day
        return instant.astimezone(resolve_timezone("America/Sao_Paulo")).date()

    def _windows_for_day(self, professional_id, service, schedule, day):
        if not schedule.is_active or day < schedule.valid_from or (schedule.valid_until and day > schedule.valid_until):
            return []
        local_tz = resolve_timezone(schedule.timezone_name)
        exception = self.repo.active_exception(professional_id, day)
        if exception and exception.mode == "CLOSED":
            return []
        if exception and exception.mode == "REPLACE":
            periods = exception.periods
        else:
            weekday = next((d for d in schedule.days if d.weekday == day.weekday() and d.is_active), None)
            if weekday is None:
                return []
            periods = weekday.periods
        duration = timedelta(minutes=service.duration_minutes + service.buffer_minutes)
        start_day = datetime.combine(day, time.min, tzinfo=local_tz).astimezone(timezone.utc)
        end_day = datetime.combine(day + timedelta(days=1), time.min, tzinfo=local_tz).astimezone(timezone.utc)
        blocks = self.repo.blocks(professional_id, start_day, end_day)
        from e_sus.modules.appointments.models import Appointment, AppointmentStatus
        from sqlalchemy.orm import joinedload

        occupied = list(self.db.scalars(
            select(Appointment).options(joinedload(Appointment.service)).where(
                Appointment.professional_id == professional_id,
                Appointment.status == AppointmentStatus.SCHEDULED.value,
                Appointment.start_at < end_day,
            )
        ))
        windows = []
        for period in periods:
            local_start = datetime.combine(day, period.start_time, tzinfo=local_tz)
            local_end = datetime.combine(day, period.end_time, tzinfo=local_tz)
            cursor = local_start
            cuts = []
            for block in blocks:
                bs = block.start_at.replace(tzinfo=timezone.utc).astimezone(local_tz) if block.start_at.tzinfo is None else block.start_at.astimezone(local_tz)
                be = block.end_at.replace(tzinfo=timezone.utc).astimezone(local_tz) if block.end_at.tzinfo is None else block.end_at.astimezone(local_tz)
                if bs < local_end and be > local_start:
                    cuts.append((max(bs, local_start), min(be, local_end)))
            for appointment in occupied:
                appointment_start = appointment.start_at.replace(tzinfo=timezone.utc) if appointment.start_at.tzinfo is None else appointment.start_at.astimezone(timezone.utc)
                appointment_end = appointment.end_at.replace(tzinfo=timezone.utc) if appointment.end_at.tzinfo is None else appointment.end_at.astimezone(timezone.utc)
                appointment_end += timedelta(minutes=appointment.service.buffer_minutes)
                booked_start = appointment_start.astimezone(local_tz)
                booked_end = appointment_end.astimezone(local_tz)
                if booked_start < local_end and booked_end > local_start:
                    cuts.append((max(booked_start, local_start), min(booked_end, local_end)))
            for cut_start, cut_end in sorted(cuts):
                self._append_feasible_window(windows, cursor, cut_start, duration)
                cursor = max(cursor, cut_end)
            self._append_feasible_window(windows, cursor, local_end, duration)
        return windows

    @staticmethod
    def _append_feasible_window(windows, start, end, duration):
        latest = end - duration
        if start <= latest:
            windows.append({"start_at": start, "end_at": latest})

    def _availability_context(self, professional_id, service_id):
        professional = self._professional(professional_id)
        service = self.repo.service(service_id)
        if service is None or not service.is_active:
            raise ValueError("Serviço ativo não encontrado.")
        if not any(item.id == service_id for item in professional.services):
            raise ValueError("Serviço não habilitado para este profissional.")
        return service

    def _schedule_for_date(self, professional_id: int, day: date):
        return next((item for item in self.repo.schedules_for_professional(professional_id) if item.is_active and item.valid_from <= day and (item.valid_until is None or item.valid_until >= day)), None)

    def _professional(self, professional_id):
        professional = self.repo.professional(professional_id)
        if professional is None or not professional.is_active:
            raise ValueError("Profissional ativo não encontrado.")
        return professional

    def _ensure_no_schedule_conflict(self, professional_id, start, end, exclude_id=None):
        conflicts = self.repo.schedules_overlapping(professional_id, start, end, exclude_id)
        if conflicts:
            raise ValueError("Vigência conflita com outra escala ativa.")
