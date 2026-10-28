import { SiteSelect } from "./site-select";
import { createContext, useContext, useState } from "react";
const FilterContext = createContext({ query: "", filter: "all" });
export function AdminTable({
  kind,
  count,
  children,
}: {
  kind?: "members" | "posts";
  count?: number;
  children: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  return (
    <FilterContext.Provider value={{ query, filter }}>
      <div className="panel">
        {kind && (
          <div className="toolbar">
            {kind === "members" && (
              <input
                aria-label="Search members"
                placeholder="Search name or email…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            )}
            <SiteSelect
              ariaLabel={
                kind === "members" ? "Filter membership" : "Filter post access"
              }
              value={filter}
              onValueChange={setFilter}
              options={(kind === "members"
                ? [
                    ["all", "All tiers"],
                    ["free", "Free"],
                    ["premium", "Premium"],
                  ]
                : [
                    ["all", "All posts"],
                    ["public", "Everyone"],
                    ["premium", "Premium only"],
                    ["draft", "Drafts"],
                  ]
              ).map(([value, label]) => ({ value, label }))}
            />
            {kind === "members" && (
              <span className="muted admin-count">{count} members</span>
            )}
          </div>
        )}
        <div className="tcell">{children}</div>
      </div>
    </FilterContext.Provider>
  );
}
export function AdminRow({
  search = "",
  category,
  status,
  children,
}: {
  search?: string;
  category?: string;
  status?: string;
  children: React.ReactNode;
}) {
  const { query, filter } = useContext(FilterContext);
  return (
    <tr
      hidden={
        !search.toLowerCase().includes(query.toLowerCase()) ||
        (filter !== "all" && category !== filter && status !== filter)
      }
    >
      {children}
    </tr>
  );
}
