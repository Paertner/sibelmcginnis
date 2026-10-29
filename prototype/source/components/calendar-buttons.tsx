import { useEffect, useRef } from "react";
import { siteText } from "@/lib/site-copy";
import { googleCalendarUrl, type CalendarEvent } from "@/lib/calendar";

// One "Add to calendar" button that opens a short menu of calendar apps.
function CalendarMenu({
  label,
  items,
}: {
  label: string;
  items: { text: string; href: string; external?: boolean }[];
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: Event) => {
      const element = menu.current;
      if (element?.open && !element.contains(event.target as Node))
        element.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <details className="calbtns cal-menu" ref={menu}>
      <summary className="btn btn-sm btn-ghost">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
          <path d="M8 3v4M16 3v4M3.5 10h17M12 13v4M10 15h4" />
        </svg>
        {label}
      </summary>
      <div className="cal-menu-list">
        {items.map((item) => (
          <a
            key={item.text}
            href={item.href}
            {...(item.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            onClick={() => {
              if (menu.current) menu.current.open = false;
            }}
          >
            {item.text}
          </a>
        ))}
      </div>
    </details>
  );
}

export function CalendarButtons({
  event,
  kind,
}: {
  event: CalendarEvent;
  kind: "session" | "booking" | "event";
}) {
  const ics = `/api/calendar/${kind}/${event.id}`;
  return (
    <CalendarMenu
      label={siteText("calendar-buttons.add-to-calendar")}
      items={[
        {
          text: siteText("calendar-buttons.google-calendar"),
          href: googleCalendarUrl(event),
          external: true,
        },
        { text: siteText("calendar-buttons.apple-calendar"), href: ics },
        { text: siteText("calendar-buttons.outlook"), href: ics },
      ]}
    />
  );
}
