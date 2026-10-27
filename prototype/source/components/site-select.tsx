import { useCallback, useEffect, useId, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };
export function SiteSelect({
  name,
  label,
  ariaLabel,
  value,
  defaultValue,
  options,
  onValueChange,
  className = "",
}: {
  name?: string;
  label?: string;
  ariaLabel?: string;
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  const id = useId(),
    menuId = `${id}-options`;
  const [localValue, setLocalValue] = useState(
    defaultValue ?? options[0]?.value ?? "",
  );
  const selected = value ?? localValue;
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === selected),
  );
  const [active, setActive] = useState(selectedIndex),
    [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null),
    menu = useRef<HTMLDivElement>(null);
  const search = useRef({ text: "", time: 0 });
  const position = useCallback(() => {
    if (!trigger.current || !menu.current) return;
    const rect = trigger.current.getBoundingClientRect(),
      gutter = 8;
    const below = innerHeight - rect.bottom - gutter,
      above = rect.top - gutter;
    const flip =
      below < Math.min(280, options.length * 44 + 14) && above > below;
    Object.assign(menu.current.style, {
      width: `${Math.min(rect.width, innerWidth - 2 * gutter)}px`,
      left: `${Math.max(gutter, Math.min(rect.left, innerWidth - rect.width - gutter))}px`,
      top: flip ? "auto" : `${rect.bottom + 6}px`,
      bottom: flip ? `${innerHeight - rect.top + 6}px` : "auto",
      maxHeight: `${Math.max(80, Math.min(320, (flip ? above : below) - 6))}px`,
    });
  }, [options.length]);
  const show = (index = selectedIndex) => {
    position();
    setActive(index);
    menu.current?.showPopover();
  };
  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    if (value === undefined) setLocalValue(option.value);
    onValueChange?.(option.value);
    menu.current?.hidePopover();
    trigger.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open, position]);
  useEffect(() => {
    if (open)
      menu.current
        ?.querySelector(`[data-index="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);
  useEffect(() => {
    const form = trigger.current?.form;
    const reset = () => setLocalValue(defaultValue ?? options[0]?.value ?? "");
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [defaultValue, options]);
  return (
    <div className={`site-select ${label ? "field" : ""} ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      {name && <input type="hidden" name={name} value={selected} />}
      <button
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        className="site-select-trigger"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={menuId}
        aria-activedescendant={open ? `${menuId}-${active}` : undefined}
        onClick={() => (open ? menu.current?.hidePopover() : show())}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? options.length - 1
                  : open
                    ? (active +
                        (event.key === "ArrowDown" ? 1 : -1) +
                        options.length) %
                      options.length
                    : selectedIndex;
            if (open) setActive(next);
            else show(next);
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (open) choose(active);
            else show();
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            menu.current?.hidePopover();
          } else if (event.key === "Tab") menu.current?.hidePopover();
          else if (
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          ) {
            event.preventDefault();
            const now = Date.now();
            search.current.text =
              now - search.current.time > 700
                ? event.key
                : search.current.text + event.key;
            search.current.time = now;
            const text = search.current.text.toLowerCase();
            const index = options.findIndex((option) =>
              option.label.toLowerCase().startsWith(text),
            );
            if (index >= 0) {
              if (open) setActive(index);
              else show(index);
            }
          }
        }}
      >
        <span>{options[selectedIndex]?.label}</span>
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="m4 6 4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div
        ref={menu}
        id={menuId}
        role="listbox"
        aria-label={label ?? ariaLabel}
        popover="auto"
        className="site-select-menu"
        onToggle={(event) => setOpen(event.newState === "open")}
      >
        {options.map((option, index) => (
          <button
            type="button"
            role="option"
            tabIndex={-1}
            id={`${menuId}-${index}`}
            key={option.value}
            aria-selected={option.value === selected}
            data-active={index === active}
            data-index={index}
            onPointerMove={() => setActive(index)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(index)}
          >
            <span>{option.label}</span>
            <span className="select-check" aria-hidden="true">
              {option.value === selected ? "✓" : ""}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
