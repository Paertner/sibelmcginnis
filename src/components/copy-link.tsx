"use client";
import { SiteText } from "@/components/site-copy";

import { useState } from "react";
export function CopyLink({ value }: { value: string }) {
  const [message, setMessage] = useState("");
  return (
    <>
      <button
        className="btn btn-sm btn-ghost"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setMessage("Copied");
          } catch {
            setMessage("Copy the meeting link shown above.");
          }
        }}
      >
        <SiteText id="copy-link.copy-link" />
      </button>
      <span role="status">{message}</span>
    </>
  );
}

/** A small icon button that copies a link and briefly shows a check mark. */
export function CopyIconButton({
  value,
  label = "Copy link",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="copy-icon-btn"
      aria-label={copied ? "Link copied" : label}
      title={copied ? "Copied" : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy this link:", value);
        }
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {copied ? (
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        ) : (
          <>
            <rect x="9" y="9" width="11" height="11" rx="2.5" />
            <path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" />
          </>
        )}
      </svg>
    </button>
  );
}
