"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");
const key = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
// Half-hour slots during the working day.
const times = Array.from({ length: 21 }, (_, i) => {
  const minutes = 9 * 60 + i * 30;
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
});
const label12 = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
};

/** An in-place date and time picker that submits `name` as YYYY-MM-DDTHH:MM in the visitor's time. */
export function DateTimePicker({
  name,
  label,
  hint,
}: {
  name: string;
  label: string;
  hint?: string;
}) {
  const id = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const today = useMemo(() => key(new Date()), []);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [focusDay, setFocusDay] = useState(today);
  const now = new Date();
  const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  useEffect(() => {
    if (open)
      grid.current
        ?.querySelector<HTMLButtonElement>(`[data-day="${focusDay}"]`)
        ?.focus();
  }, [open, focusDay, month]);

  const first = (month.getDay() + 6) % 7;
  const days = Array.from(
    {
      length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
    },
    (_, i) => key(new Date(month.getFullYear(), month.getMonth(), i + 1)),
  );
  const moveFocus = (days: number) => {
    const next = fromKey(focusDay);
    next.setDate(next.getDate() + days);
    const value = key(next);
    if (value < today) return;
    setFocusDay(value);
    if (next.getMonth() !== month.getMonth())
      setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  };
  const summary =
    date && time
      ? `${fromKey(date).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })} · ${label12(time)}`
      : date
        ? `${fromKey(date).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })} · choose a time`
        : "";

  return (
    <div className="field dtp" ref={wrapper}>
      <span id={`${id}-label`}>{label}</span>
      <button
        type="button"
        className={`dtp-trigger${summary ? " filled" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
          <path d="M8 3v4M16 3v4M3.5 10h17" />
        </svg>
        <span id={`${id}-value`}>{summary || "Choose a date and time"}</span>
      </button>
      <input
        type="hidden"
        name={name}
        value={date && time ? `${date}T${time}` : ""}
      />
      {hint ? <small className="dtp-hint">{hint}</small> : null}
      {open ? (
        <div
          className="dtp-panel"
          role="dialog"
          aria-label={label}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              wrapper.current
                ?.querySelector<HTMLButtonElement>(".dtp-trigger")
                ?.focus();
            }
          }}
        >
          <div className="dtp-calendar">
            <div className="dtp-month">
              <button
                type="button"
                aria-label="Previous month"
                disabled={key(month) <= today.slice(0, 8) + "01"}
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
              >
                ‹
              </button>
              <b aria-live="polite">
                {month.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </b>
              <button
                type="button"
                aria-label="Next month"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
              >
                ›
              </button>
            </div>
            <div className="dtp-grid" role="grid" ref={grid}>
              {weekdays.map((day) => (
                <span key={day} className="dtp-weekday" role="columnheader">
                  {day}
                </span>
              ))}
              {Array.from({ length: first }, (_, i) => (
                <span key={`gap-${i}`} />
              ))}
              {days.map((day) => {
                const past = day < today;
                return (
                  <button
                    type="button"
                    key={day}
                    data-day={day}
                    role="gridcell"
                    tabIndex={day === focusDay ? 0 : -1}
                    disabled={past}
                    aria-selected={day === date}
                    aria-label={fromKey(day).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                    className={`dtp-day${day === today ? " today" : ""}`}
                    onClick={() => {
                      setDate(day);
                      setFocusDay(day);
                      if (day === today && time && time <= nowTime) setTime("");
                    }}
                    onKeyDown={(event) => {
                      const step = {
                        ArrowLeft: -1,
                        ArrowRight: 1,
                        ArrowUp: -7,
                        ArrowDown: 7,
                      }[event.key];
                      if (step) {
                        event.preventDefault();
                        moveFocus(step);
                      }
                    }}
                  >
                    {Number(day.slice(8))}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="dtp-times">
            <b>
              {date
                ? fromKey(date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })
                : "Pick a day first"}
            </b>
            <div className="dtp-time-list" role="listbox" aria-label="Time">
              {times.map((t) => {
                const unavailable = !date || (date === today && t <= nowTime);
                return (
                  <button
                    type="button"
                    key={t}
                    role="option"
                    aria-selected={t === time}
                    disabled={unavailable}
                    className="dtp-time"
                    onClick={() => setTime(t)}
                  >
                    {label12(t)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="dtp-actions">
            <button
              type="button"
              className="dtp-clear"
              onClick={() => {
                setDate("");
                setTime("");
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn-sm"
              disabled={!date || !time}
              onClick={() => {
                setOpen(false);
                wrapper.current
                  ?.querySelector<HTMLButtonElement>(".dtp-trigger")
                  ?.focus();
              }}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
