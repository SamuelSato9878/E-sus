from datetime import date, datetime, time, timedelta, timezone
from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import AliasPath, BaseModel, ConfigDict, Field, field_validator, model_validator


class PeriodInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    start_time: time
    end_time: time

    @model_validator(mode="after")
    def valid_order(self):
        if self.start_time >= self.end_time:
            raise ValueError("Horário inicial deve ser anterior ao final.")
        return self


def validate_periods(periods: list[PeriodInput]) -> list[PeriodInput]:
    ordered = sorted(periods, key=lambda item: item.start_time)
    for previous, current in zip(ordered, ordered[1:]):
        if current.start_time < previous.end_time:
            raise ValueError("Períodos não podem se sobrepor.")
    return ordered


def resolve_timezone(name: str):
    try:
        return ZoneInfo(name)
    except ZoneInfoNotFoundError as error:
        # Windows Python installations may omit the IANA database. Brazil has
        # used UTC-03:00 year-round since 2019, which covers current schedules.
        if name == "America/Sao_Paulo":
            return timezone(timedelta(hours=-3), name)
        raise ValueError("Fuso horário IANA indisponível ou inválido.") from error


class ScheduleCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    valid_from: date
    valid_until: date | None = None
    timezone_name: str = "America/Sao_Paulo"

    @model_validator(mode="after")
    def validate_schedule(self):
        if self.valid_until and self.valid_until < self.valid_from:
            raise ValueError("Término da vigência deve ser posterior ao início.")
        resolve_timezone(self.timezone_name)
        return self


class ScheduleUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    valid_from: date | None = None
    valid_until: date | None = None
    timezone_name: str | None = None
    is_active: bool | None = None

    @field_validator("timezone_name")
    @classmethod
    def validate_timezone(cls, value):
        if value is None:
            raise ValueError("Fuso horário não pode ser nulo.")
        resolve_timezone(value)
        return value


class ScheduleDayInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    is_active: bool
    periods: list[PeriodInput] = Field(default_factory=list)

    @model_validator(mode="after")
    def check_periods(self):
        validate_periods(self.periods)
        if self.is_active and not self.periods:
            raise ValueError("Dia ativo deve possuir pelo menos um período.")
        if not self.is_active and self.periods:
            raise ValueError("Dia inativo não pode possuir períodos.")
        return self


class ScheduleDayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    weekday: int
    is_active: bool
    periods: list["SchedulePeriodResponse"]


class SchedulePeriodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    start_time: time
    end_time: time


class ScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    professional_id: int
    professional_name: str = Field(validation_alias=AliasPath("professional", "name"))
    valid_from: date
    valid_until: date | None
    timezone_name: str
    is_active: bool
    days: list[ScheduleDayResponse]
    created_at: datetime
    updated_at: datetime


class CopyDaysRequest(BaseModel):
    source_weekday: int = Field(ge=0, le=6)
    target_weekdays: list[int]

    @field_validator("target_weekdays")
    @classmethod
    def distinct_weekdays(cls, values):
        if any(day < 0 or day > 6 for day in values) or len(values) != len(set(values)):
            raise ValueError("Dias alvo devem ser únicos e estar entre 0 e 6.")
        return values


class ReplicateScheduleRequest(BaseModel):
    professional_ids: list[int] = Field(min_length=1)


class ExceptionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    exception_date: date
    mode: Literal["CLOSED", "REPLACE"]
    reason: str | None = Field(default=None, max_length=500)
    periods: list[PeriodInput] = Field(default_factory=list)

    @model_validator(mode="after")
    def check_periods(self):
        validate_periods(self.periods)
        if (self.mode == "REPLACE") != bool(self.periods):
            raise ValueError("Exceção REPLACE exige períodos; CLOSED não aceita períodos.")
        return self


class ExceptionUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    mode: Literal["CLOSED", "REPLACE"] | None = None
    reason: str | None = Field(default=None, max_length=500)
    periods: list[PeriodInput] | None = None
    is_active: bool | None = None

    @field_validator("periods")
    @classmethod
    def validate_period_list(cls, values):
        return None if values is None else validate_periods(values)


class ScheduleExceptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    professional_id: int
    professional_name: str = Field(validation_alias=AliasPath("professional", "name"))
    exception_date: date
    mode: str
    reason: str | None
    is_active: bool
    periods: list[SchedulePeriodResponse]


class BlockCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    start_at: datetime
    end_at: datetime
    reason: str = Field(min_length=1, max_length=500)

    @model_validator(mode="after")
    def validate_range(self):
        if self.start_at.tzinfo is None or self.end_at.tzinfo is None:
            raise ValueError("Bloqueios devem incluir offset de fuso horário.")
        if self.end_at <= self.start_at:
            raise ValueError("Término do bloqueio deve ser posterior ao início.")
        return self


class BlockUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    start_at: datetime | None = None
    end_at: datetime | None = None
    reason: str | None = Field(default=None, min_length=1, max_length=500)
    is_active: bool | None = None

    @model_validator(mode="after")
    def validate_range(self):
        for value in (self.start_at, self.end_at):
            if value is not None and value.tzinfo is None:
                raise ValueError("Bloqueios devem incluir offset de fuso horário.")
        if self.start_at is not None and self.end_at is not None and self.end_at <= self.start_at:
            raise ValueError("Término do bloqueio deve ser posterior ao início.")
        return self


class ScheduleBlockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    professional_id: int
    professional_name: str = Field(validation_alias=AliasPath("professional", "name"))
    start_at: datetime
    end_at: datetime
    reason: str
    is_active: bool
    created_by_user_id: int


class AvailabilityWindow(BaseModel):
    start_at: datetime
    end_at: datetime


class AvailabilityResponse(BaseModel):
    professional_id: int
    professional_name: str
    service_id: int
    date: date
    timezone_name: str
    windows: list[AvailabilityWindow]
    reservation_ready: bool = False
    pending_validation: str | None = "Conflitos com appointments ainda não são verificados."
