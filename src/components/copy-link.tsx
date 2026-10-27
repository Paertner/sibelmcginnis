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
