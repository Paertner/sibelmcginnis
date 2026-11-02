"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type ToastItem = { id: number; message: string; ok: boolean };
type Push = (message: string, ok?: boolean) => void;

const ToastContext = createContext<Push>(() => {});
/** Shows a small message chip in the bottom-right corner: toast(message, ok). */
export const useToast = () => useContext(ToastContext);

const MAX_VISIBLE = 4;
const SUCCESS_MS = 5000;
const ERROR_MS = 8000;

function Chip({
  toast,
  onClose,
}: {
  toast: ToastItem;
  onClose: (id: number) => void;
}) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(
      () => onClose(toast.id),
      toast.ok ? SUCCESS_MS : ERROR_MS,
    );
    return () => clearTimeout(timer);
  }, [paused, toast.id, toast.ok, onClose]);
  return (
    <div
      className={`toast ${toast.ok ? "toast-ok" : "toast-error"}`}
      role="status"
      aria-live={toast.ok ? "polite" : "assertive"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <svg
        className="toast-icon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {toast.ok ? (
          <path d="M20 6 9 17l-5-5" />
        ) : (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16.5v.01" />
          </>
        )}
      </svg>
      <span className="toast-text">{toast.message}</span>
      <button
        type="button"
        className="toast-close"
        aria-label="Dismiss message"
        onClick={() => onClose(toast.id)}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}

/** One stack for the whole site. It sits inside the open dialog, if any, so it is never hidden behind one. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const next = useRef(1);

  useEffect(() => {
    const pick = () => {
      const open = document.querySelectorAll<HTMLElement>("dialog[open]");
      setTarget(open.length ? open[open.length - 1] : document.body);
    };
    pick();
    const observer = new MutationObserver(pick);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    return () => observer.disconnect();
  }, []);

  const push = useCallback<Push>((message, ok = true) => {
    if (!message) return;
    setToasts((all) => {
      // The same message again replaces the older chip instead of piling up.
      const rest = all.filter((t) => !(t.message === message && t.ok === ok));
      return [...rest, { id: next.current++, message, ok }].slice(-MAX_VISIBLE);
    });
  }, []);
  const close = useCallback(
    (id: number) => setToasts((all) => all.filter((t) => t.id !== id)),
    [],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      {target
        ? createPortal(
            <div className="toast-stack">
              {toasts.map((t) => (
                <Chip key={t.id} toast={t} onClose={close} />
              ))}
            </div>,
            target,
          )
        : null}
    </ToastContext.Provider>
  );
}

/** Shows a toast whenever `result` changes to a new message; renders nothing. */
export function Notify({
  result,
}: {
  result: { message: string; ok?: boolean } | null | undefined;
}) {
  const toast = useToast();
  useEffect(() => {
    if (result?.message) toast(result.message, result.ok ?? false);
  }, [result, toast]);
  return null;
}
