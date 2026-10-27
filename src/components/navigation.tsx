"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navigation } from "@/lib/navigation";
import { SiteText } from "./site-copy";
export function Navigation() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <>
      <nav
        aria-label="Main navigation"
        id="navigation"
        className={`nav ${open ? "open" : ""}`}
      >
        {navigation.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={path === href ? "active" : ""}
            aria-current={path === href ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            <SiteText id={`navigation.${href}`} fallback={label} />
          </Link>
        ))}
      </nav>
      <button
        className="burger"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-controls="navigation"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "×" : "☰"}
      </button>
    </>
  );
}
