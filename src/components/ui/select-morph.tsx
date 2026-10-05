"use client";

import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

interface MorphContextValue {
  value: string | undefined;
  open: boolean;
  setOpen: (open: boolean) => void;
  select: (value: string) => void;
  register: (value: string, label: string) => void;
  unregister: (value: string) => void;
  labelFor: (value: string | undefined) => string | undefined;
  placeholder: string;
  setPlaceholder: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  reduce: boolean;
  layoutId: string;
  triggerId: string;
  listId: string;
  disabled: boolean;
  options: { label: string }[];
}

const MorphContext = createContext<MorphContextValue | null>(null);

function useMorphContext(component: string) {
  const context = useContext(MorphContext);
  if (!context)
    throw new Error(`${component} must be used within <MorphSelect>`);
  return context;
}

export interface MorphSelectProps {
  id?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function MorphSelect({
  id,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  className,
  children,
}: MorphSelectProps) {
  const reduce = useReducedMotion() ?? false;
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  const [labels, setLabels] = useState(
    new Map<string, { label: string; count: number }>(),
  );
  const [placeholder, setPlaceholder] = useState("Select");
  const [searchQuery, setSearchQuery] = useState("");
  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  const select = useCallback(
    (next: string) => {
      if (!controlled) setInternal(next);
      onValueChange?.(next);
      setOpen(false);
    },
    [controlled, onValueChange],
  );
  const register = useCallback((itemValue: string, label: string) => {
    setLabels((currentLabels) => {
      const next = new Map(currentLabels);
      next.set(itemValue, {
        label,
        count: (currentLabels.get(itemValue)?.count ?? 0) + 1,
      });
      return next;
    });
  }, []);
  const unregister = useCallback((itemValue: string) => {
    setLabels((currentLabels) => {
      const entry = currentLabels.get(itemValue);
      if (!entry) return currentLabels;
      const next = new Map(currentLabels);
      if (entry.count <= 1) next.delete(itemValue);
      else next.set(itemValue, { label: entry.label, count: entry.count - 1 });
      return next;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node))
        setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const context = useMemo<MorphContextValue>(
    () => ({
      options: Array.from(labels.values()),
      value: current,
      open,
      setOpen,
      select,
      register,
      unregister,
      labelFor: (itemValue) =>
        itemValue === undefined ? undefined : labels.get(itemValue)?.label,
      placeholder,
      setPlaceholder,
      searchQuery,
      setSearchQuery,
      reduce,
      layoutId: `${baseId}-surface`,
      triggerId: id ?? `${baseId}-trigger`,
      listId: `${baseId}-list`,
      disabled,
    }),
    [
      current,
      open,
      select,
      register,
      unregister,
      labels,
      placeholder,
      searchQuery,
      reduce,
      baseId,
      id,
      disabled,
    ],
  );

  return (
    <MorphContext.Provider value={context}>
      <div
        ref={rootRef}
        className={cn("relative mq-select", className)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node))
            setOpen(false);
        }}
      >
        {children}
      </div>
    </MorphContext.Provider>
  );
}

export function MorphSelectValue({
  placeholder,
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const context = useMorphContext("MorphSelectValue");
  useEffect(() => {
    if (placeholder) context.setPlaceholder(placeholder);
  }, [placeholder, context.setPlaceholder]);
  const label = context.labelFor(context.value);
  return (
    <span
      className={cn(
        label ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {label ?? placeholder ?? "Select"}
    </span>
  );
}

export function MorphSelectTrigger({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const context = useMorphContext("MorphSelectTrigger");
  return (
    <button
      type="button"
      id={context.triggerId}
      disabled={context.disabled}
      aria-haspopup="listbox"
      aria-expanded={context.open}
      aria-controls={context.listId}
      onClick={() => context.setOpen(!context.open)}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          context.setOpen(true);
        }
      }}
      className={cn("mq-select-trigger", className)}
    >
      <span className="min-w-0 truncate">{children}</span>
      <ChevronDown
        size={17}
        aria-hidden
        className={context.open ? "rotate-180" : ""}
      />
    </button>
  );
}

export function MorphSelectContent({
  className,
  children,
  searchable,
  searchPlaceholder = "Search...",
}: {
  className?: string;
  children: ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const context = useMorphContext("MorphSelectContent");
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!context.open) {
      context.setSearchQuery("");
      return;
    }
    panel.current
      ?.querySelector<HTMLElement>(
        searchable ? "input" : '[role="option"]:not(:disabled)',
      )
      ?.focus();
  }, [context.open, context.setSearchQuery, searchable]);
  const empty = !context.options.some(({ label }) =>
    label
      .toLocaleLowerCase()
      .includes(context.searchQuery.trim().toLocaleLowerCase()),
  );
  return (
    <>
      <div hidden aria-hidden>
        {children}
      </div>
      <AnimatePresence initial={false}>
        {context.open && (
          <motion.div
            initial={
              context.reduce ? false : { opacity: 0, y: -8, scale: 0.97 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              context.reduce
                ? { opacity: 0 }
                : { opacity: 0, y: -6, scale: 0.98 }
            }
            transition={{
              duration: context.reduce ? 0 : 0.18,
              ease: "easeOut",
            }}
            style={{ transformOrigin: "top center" }}
            ref={panel}
            className={cn("mq-select-panel", className)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                context.setOpen(false);
                document.getElementById(context.triggerId)?.focus();
                return;
              }
              const options = Array.from(
                panel.current?.querySelectorAll<HTMLButtonElement>(
                  '[role="option"]:not(:disabled)',
                ) ?? [],
              );
              const index = options.indexOf(
                document.activeElement as HTMLButtonElement,
              );
              let next = -1;
              if (event.key === "ArrowDown")
                next = (index + 1) % options.length;
              if (event.key === "ArrowUp")
                next = (index - 1 + options.length) % options.length;
              if (event.key === "Home" && index >= 0) next = 0;
              if (event.key === "End" && index >= 0) next = options.length - 1;
              if (next >= 0) {
                event.preventDefault();
                options[next]?.focus();
              }
            }}
          >
            {searchable && (
              <div className="mq-select-search">
                <input
                  type="search"
                  aria-label={searchPlaceholder}
                  placeholder={searchPlaceholder}
                  value={context.searchQuery}
                  onChange={(event) =>
                    context.setSearchQuery(event.target.value)
                  }
                />
              </div>
            )}
            <ul
              id={context.listId}
              role="listbox"
              aria-labelledby={context.triggerId}
              className="mq-select-options"
            >
              {children}
            </ul>
            {empty && (
              <p className="mq-select-empty" role="status">
                {document.documentElement.lang === "si"
                  ? "තේරීම් හමු නොවීය"
                  : "No options found"}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function MorphSelectItem({
  value,
  disabled = false,
  className,
  children,
}: {
  value: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const context = useMorphContext("MorphSelectItem");
  const selected = context.value === value;
  const label = typeof children === "string" ? children : value;
  useLayoutEffect(() => {
    context.register(value, label);
    return () => context.unregister(value);
  }, [context.register, context.unregister, value, label]);
  if (
    context.searchQuery &&
    !label
      .toLocaleLowerCase()
      .includes(context.searchQuery.trim().toLocaleLowerCase())
  )
    return null;
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={selected}
        disabled={disabled}
        onClick={() => {
          context.select(value);
          document.getElementById(context.triggerId)?.focus();
        }}
        className={cn("mq-select-option", className)}
      >
        <span>{children}</span>
        {selected && <Check size={17} aria-hidden />}
      </button>
    </li>
  );
}
export default MorphSelect;
