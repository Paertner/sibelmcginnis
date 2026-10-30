"use client";
import { useEffect } from "react";
/** Adds a stronger shadow to the sticky header once the page is scrolled. */
export function HeaderShadow() {
  useEffect(() => {
    const header = document.querySelector(".site-header");
    const update = () =>
      header?.classList.toggle("scrolled", window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return null;
}
