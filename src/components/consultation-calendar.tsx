"use client";
import { SiteText } from "@/components/site-copy";

import { useState } from "react";
import { ActionForm } from "./action-form";
import { bookCompany, bookConsultation } from "@/lib/actions";
import { fmtDate } from "@/lib/dates";

type AvailableDay = { date: string; label: string; times: string[] };
export function BookingForm({
  days,
  minutes = 45,
  company,
}: {
  days: AvailableDay[];
  minutes?: number;
  /** A company booking through its link: asks for company details instead of using a membership. */
  company?: { token: string };
}) {
  const [month, setMonth] = useState(days[0]?.date.slice(0, 7) ?? "");
  const [selection, setSelection] = useState({
    date: days[0]?.date ?? "",
    time: "",
  });
  if (!days.length)
    return (
      <div className="booking-empty">
        <h3>
          <SiteText id="consultation-calendar.no-times-available-just-now" />
        </h3>
        <p>
          <SiteText id="consultation-calendar.there-are-no-remaining-consultation-slots-available-to-your-membe" />
        </p>
      </div>
    );
  const months = [...new Set(days.map((d) => d.date.slice(0, 7)))].toSorted();
  const visibleMonth = months.includes(month) ? month : months[0];
  const available = days.filter((d) => d.date.startsWith(visibleMonth));
  const activeDay =
    available.find((d) => d.date === selection.date) ?? available[0];
  const time =
    selection.date === activeDay.date &&
    activeDay.times.includes(selection.time)
      ? selection.time
      : "";
  const first = new Date(`${visibleMonth}-01T12:00:00Z`);
  const offset = (first.getUTCDay() + 6) % 7;
  const length = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const cells = Array.from(
    { length: Math.ceil((offset + length) / 7) * 7 },
    (_, i) => i - offset + 1,
  );
  const monthIndex = months.indexOf(visibleMonth);
  return (
    <div className={`booking-widget ${company ? "is-company" : ""}`}>
      <aside className="booking-summary">
        <div className="coach-monogram" aria-hidden="true">
          <SiteText id="consultation-calendar.sm" />
        </div>
        <p className="booking-host">
          <SiteText id="consultation-calendar.sibel-mcginnis" />
        </p>
        <h2>
          <SiteText id="consultation-calendar.your-one-on-one-consultation" />
        </h2>
        <div className="consultation-facts">
          <p>
            <span aria-hidden="true">◷</span>
            {minutes} <SiteText id="consultation-calendar.minutes" />
          </p>
          <p>
            <span aria-hidden="true">◉</span>
            <SiteText id="consultation-calendar.online-on-zoom" />
          </p>
        </div>
        <p>
          <SiteText id="consultation-calendar.a-little-time-set-aside-for-your-questions-your-growth-and-your-n" />
        </p>
        <p className="booking-perk">
          {company ? (
            <SiteText id="company.perk" />
          ) : (
            <SiteText id="consultation-calendar.included-with-your-premium-membership" />
          )}
        </p>
        <p className="booking-schedule-note">
          <SiteText id="consultation-calendar.times-are-shown-as-scheduled-by-sibel-the-meeting-timezone-will-b" />
        </p>
      </aside>
      <div className="booking-calendar">
        <h3>
          <SiteText id="consultation-calendar.select-a-date-amp-time" />
        </h3>
        <div className="calendar-month">
          <span aria-live="polite">
            {first.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            })}
          </span>
          <div>
            <button
              type="button"
              aria-label="Previous month"
              disabled={monthIndex === 0}
              onClick={() => setMonth(months[monthIndex - 1])}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next month"
              disabled={monthIndex === months.length - 1}
              onClick={() => setMonth(months[monthIndex + 1])}
            >
              ›
            </button>
          </div>
        </div>
        <table aria-label="Choose a consultation date" className="month-grid">
          <thead>
            <tr>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <th scope="col" key={day}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: cells.length / 7 }, (_, week) => (
              <tr key={week}>
                {cells.slice(week * 7, week * 7 + 7).map((day, index) => {
                  if (day < 1 || day > length) return <td key={index} />;
                  const date = `${visibleMonth}-${String(day).padStart(2, "0")}`,
                    enabled = available.some((d) => d.date === date);
                  const label = fmtDate(date, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  });
                  return (
                    <td key={index}>
                      <button
                        type="button"
                        className={`calendar-day ${date === activeDay.date ? "selected" : ""}`}
                        aria-label={
                          enabled ? `Choose ${label}` : `${label}, unavailable`
                        }
                        aria-pressed={
                          enabled ? date === activeDay.date : undefined
                        }
                        disabled={!enabled}
                        onClick={() => setSelection({ date, time: "" })}
                      >
                        {day}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="calendar-key">
          <span /> <SiteText id="consultation-calendar.available-dates" />
        </div>
        <p className="booking-window">
          <SiteText id="consultation-calendar.appointments-are-open-for-the-next-three-weeks" />
        </p>
      </div>
      <ActionForm
        action={company ? bookCompany : bookConsultation}
        className={`booking-times ${company ? "company-times" : ""}`}
        submitLabel={company ? "Confirm booking" : "Request consultation"}
        submitDisabled={!time}
      >
        <input name="date" type="hidden" value={activeDay.date} />
        {company ? (
          <input name="token" type="hidden" value={company.token} />
        ) : null}
        <h3>
          {fmtDate(activeDay.date, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </h3>
        <p className="muted">
          <SiteText id="consultation-calendar.available-times" />
        </p>
        <fieldset className="time-options">
          <legend className="sr-only">
            <SiteText id="consultation-calendar.choose-a-consultation-time" />
          </legend>
          {activeDay.times.map((t) => (
            <label
              className={`calendar-time ${time === t ? "selected" : ""}`}
              key={`${activeDay.date}-${t}`}
            >
              <input
                type="radio"
                name="time"
                value={t}
                checked={time === t}
                onChange={() => setSelection({ date: activeDay.date, time: t })}
                required
              />
              {t}
            </label>
          ))}
        </fieldset>
        {company ? (
          <div className="booking-confirmation company-details">
            <p>
              {time ? (
                <>
                  <b>
                    {fmtDate(activeDay.date, { month: "long", day: "numeric" })}{" "}
                    <SiteText id="consultation-calendar.at" /> {time}
                  </b>
                  <br />
                  <small>
                    {minutes}{" "}
                    <SiteText id="consultation-calendar.minutes-zoom" />
                  </small>
                </>
              ) : (
                <SiteText id="consultation-calendar.choose-a-time-to-continue" />
              )}
            </p>
            <label className="field">
              <SiteText id="company.company-name" />
              <input
                name="company"
                maxLength={120}
                autoComplete="organization"
                required
              />
            </label>
            <label className="field">
              <SiteText id="company.contact-person" />
              <input
                name="contact"
                maxLength={120}
                autoComplete="name"
                required
              />
            </label>
            <label className="field">
              <SiteText id="company.email" />
              <input
                name="email"
                type="email"
                maxLength={254}
                autoComplete="email"
                required
              />
            </label>
            <label className="field">
              <SiteText id="company.phone" />
              <input
                name="phone"
                type="tel"
                maxLength={40}
                autoComplete="tel"
                required
              />
            </label>
            <label className="field">
              <SiteText id="company.topic" />
              <textarea
                name="topic"
                placeholder="A few words help Sibel prepare"
                maxLength={1000}
                required
              />
            </label>
          </div>
        ) : time ? (
          <div className="booking-confirmation">
            <p>
              <b>
                {fmtDate(activeDay.date, { month: "long", day: "numeric" })}{" "}
                <SiteText id="consultation-calendar.at" /> {time}
              </b>
              <br />
              <small>
                {minutes} <SiteText id="consultation-calendar.minutes-zoom" />
              </small>
            </p>
            <label className="field">
              <SiteText id="consultation-calendar.what-would-you-like-to-talk-about" />
              <textarea
                name="topic"
                placeholder="A few words help Sibel prepare"
                maxLength={1000}
              />
            </label>
          </div>
        ) : (
          <p className="booking-time-hint">
            <SiteText id="consultation-calendar.choose-a-time-to-continue" />
          </p>
        )}
      </ActionForm>
    </div>
  );
}
