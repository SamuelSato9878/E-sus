import { useEffect, useState } from "react";

export function maskDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 4
    ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
    : digits.length > 2
      ? `${digits.slice(0, 2)}/${digits.slice(2)}`
      : digits;
}

export function toIsoDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
    ? `${year}-${month}-${day}`
    : "";
}

export function fromIsoDate(value?: string | null) {
  if (!value) return "";
  const match = value.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

export function DateInput({
  value,
  onChange,
  name,
  defaultValue,
  required,
  disabled,
  readOnly,
  ariaLabel,
}: {
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  ariaLabel?: string;
}) {
  const [displayed, setDisplayed] = useState(fromIsoDate(value ?? defaultValue));
  useEffect(() => {
    if (value !== undefined) setDisplayed(fromIsoDate(value));
  }, [value]);
  const iso = toIsoDate(displayed);
  return (
    <>
      {name && <input type="hidden" name={name} value={iso} />}
      <input
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        value={displayed}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        aria-label={ariaLabel}
        maxLength={10}
        onChange={(event) => {
          const next = maskDate(event.target.value);
          setDisplayed(next);
          const parsed = toIsoDate(next);
          event.target.setCustomValidity(
            next && !parsed ? "Informe uma data válida no formato dd/mm/aaaa." : "",
          );
          if (parsed || !next) onChange?.(parsed);
        }}
      />
    </>
  );
}

export function DateTimeInput({
  name,
  defaultValue,
  required,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [displayed, setDisplayed] = useState(() => {
    if (!defaultValue) return "";
    const [date, time = ""] = defaultValue.split("T");
    return `${fromIsoDate(date)}${time ? ` ${time.slice(0, 5)}` : ""}`;
  });
  const [dateText, timeText = ""] = displayed.split(" ");
  const isoDate = toIsoDate(dateText);
  const time = timeText.match(/^(\d{2}):?(\d{0,2})$/);
  const normalizedTime = time ? `${time[1]}:${time[2]}` : "";
  const iso = isoDate && /^\d{2}:\d{2}$/.test(normalizedTime)
    ? `${isoDate}T${normalizedTime}`
    : "";
  return (
    <>
      <input type="hidden" name={name} value={iso} />
      <input
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa HH:MM"
        value={displayed}
        required={required}
        maxLength={16}
        onChange={(event) => {
          const raw = event.target.value;
          const datePart = raw.slice(0, 10);
          const timePart = raw.slice(10).replace(/[^\d:]/g, "").slice(0, 5);
          const digits = timePart.replace(/\D/g, "").slice(0, 4);
          const formattedTime = digits.length > 2
            ? `${digits.slice(0, 2)}:${digits.slice(2)}`
            : digits;
          const next = `${maskDate(datePart)}${formattedTime ? ` ${formattedTime}` : ""}`;
          setDisplayed(next);
          const [nextDate, nextTime = ""] = next.split(" ");
          const parsedDate = toIsoDate(nextDate);
          const parsedTime = nextTime.match(/^(\d{2}):(\d{2})$/);
          const validTime = parsedTime &&
            Number(parsedTime[1]) < 24 && Number(parsedTime[2]) < 60;
          event.currentTarget.setCustomValidity(
            next && (!parsedDate || !validTime)
              ? "Informe uma data e horário válidos no formato dd/mm/aaaa HH:MM."
              : "",
          );
        }}
      />
    </>
  );
}
