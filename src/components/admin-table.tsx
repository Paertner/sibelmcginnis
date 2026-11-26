"use client";
import { SiteSelect } from "./site-select";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
type Sort = { key: string; dir: "asc" | "desc" } | null;
const FilterContext = createContext<{
  query: string;
  filter: string;
  sort: Sort;
  setSort: (sort: Sort) => void;
}>({ query: "", filter: "all", sort: null, setSort: () => {} });
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
  const [sort, setSort] = useState<Sort>(null);
  // The count follows the search and the tier filter: it counts the rows left on screen.
  const panel = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(count);
  useEffect(() => {
    setShown(
      panel.current?.querySelectorAll("tbody tr:not([hidden])").length ?? count,
    );
  }, [query, filter, count]);
  return (
    <FilterContext.Provider value={{ query, filter, sort, setSort }}>
      <div className="panel" ref={panel}>
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
              <span className="muted admin-count" aria-live="polite">
                {shown === count ? count : `${shown} of ${count}`} members
              </span>
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
  /** Values SortedRows orders by, one per sortable column. */
  sortBy?: Record<string, string>;
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

/** A column title that sorts the rows below it; a second click reverses the order. */
export function SortHeader({
  label,
  sortKey,
  first = "asc",
}: {
  label: string;
  sortKey: string;
  first?: "asc" | "desc";
}) {
  const { sort, setSort } = useContext(FilterContext);
  const active = sort?.key === sortKey ? sort.dir : null;
  return (
    <th
      aria-sort={
        active === "asc"
          ? "ascending"
          : active === "desc"
            ? "descending"
            : "none"
      }
    >
      <button
        type="button"
        className={`th-sort${active ? " on" : ""}`}
        onClick={() =>
          setSort({
            key: sortKey,
            dir: active ? (active === "asc" ? "desc" : "asc") : first,
          })
        }
      >
        {label}
        <span aria-hidden="true">
          {active === "asc" ? "↑" : active === "desc" ? "↓" : "↕"}
        </span>
      </button>
    </th>
  );
}

/** Rows in the order chosen with SortHeader; each AdminRow gives its values in sortBy. */
export function SortedRows({ children }: { children: React.ReactNode }) {
  const { sort } = useContext(FilterContext);
  const rows = Children.toArray(children).filter(
    isValidElement,
  ) as ReactElement<{
    sortBy?: Record<string, string>;
  }>[];
  if (!sort) return <>{rows}</>;
  const value = (row: ReactElement<{ sortBy?: Record<string, string> }>) =>
    row.props.sortBy?.[sort.key] ?? "";
  const sorted = [...rows].sort((a, b) => {
    const order = value(a).localeCompare(value(b), undefined, {
      sensitivity: "base",
      numeric: true,
    });
    return sort.dir === "asc" ? order : -order;
  });
  return <>{sorted}</>;
}
