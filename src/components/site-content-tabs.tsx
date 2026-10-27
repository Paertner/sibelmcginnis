"use client";
import { useId, useState } from "react";
const labels = ["General settings", "Page text"];
export function SiteContentTabs({
  settings,
  text,
}: {
  settings: React.ReactNode;
  text: React.ReactNode;
}) {
  const [tab, setTab] = useState(0),
    id = useId();
  return (
    <>
      <div
        className="content-tabs"
        role="tablist"
        aria-label="Site content editors"
      >
        {labels.map((label, index) => (
          <button
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={tab === index}
            tabIndex={tab === index ? 0 : -1}
            key={label}
            onClick={() => setTab(index)}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? labels.length - 1
                    : (tab +
                        (event.key === "ArrowRight" ? 1 : labels.length - 1)) %
                      labels.length;
              setTab(next);
              document.getElementById(`${id}-tab-${next}`)?.focus();
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {[settings, text].map((node, index) => (
        <div
          role="tabpanel"
          aria-labelledby={`${id}-tab-${index}`}
          id={`${id}-panel-${index}`}
          hidden={tab !== index}
          key={index}
        >
          {node}
        </div>
      ))}
    </>
  );
}
