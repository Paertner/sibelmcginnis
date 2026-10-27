"use client";
import { createContext, useContext } from "react";
import catalog from "@/lib/site-copy-catalog.json";
const defaults = new Map(catalog.map((entry) => [entry.id, entry.text]));
const CopyContext = createContext<Record<string, string>>({});
export function SiteCopyProvider({
  values,
  children,
}: {
  values: Record<string, string>;
  children: React.ReactNode;
}) {
  return <CopyContext.Provider value={values}>{children}</CopyContext.Provider>;
}
export function SiteText({
  id,
  fallback = "",
}: {
  id: string;
  fallback?: string;
}) {
  const values = useContext(CopyContext);
  return <>{values[id] ?? defaults.get(id) ?? fallback}</>;
}
