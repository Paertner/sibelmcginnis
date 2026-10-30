"use client";
import { createContext, useContext } from "react";
import catalog from "@/lib/site-copy-catalog.json";
import { withWeekday } from "@/lib/weekday";
const defaults = new Map(catalog.map((entry) => [entry.id, entry.text]));
const CopyContext = createContext<{
  values: Record<string, string>;
  weekday: number;
}>({ values: {}, weekday: 6 });
export function SiteCopyProvider({
  values,
  weekday,
  children,
}: {
  values: Record<string, string>;
  weekday: number;
  children: React.ReactNode;
}) {
  return (
    <CopyContext.Provider value={{ values, weekday }}>
      {children}
    </CopyContext.Provider>
  );
}
export function SiteText({
  id,
  fallback = "",
}: {
  id: string;
  fallback?: string;
}) {
  const { values, weekday } = useContext(CopyContext);
  // Texts the owner wrote are shown as written; only built-in wording follows the weekday.
  if (values[id] !== undefined) return <>{values[id]}</>;
  return <>{withWeekday(defaults.get(id) ?? fallback, weekday)}</>;
}
