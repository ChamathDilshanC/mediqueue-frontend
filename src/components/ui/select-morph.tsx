"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
  type Variants,
} from "motion/react";
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

const MORPH: Transition = { type: "spring", duration: 0.5, bounce: 0.22 };
const ROW =
  "flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-sm";
const LIST: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035, delayChildren: 0.08 } },
};
const ITEM: Variants = {
  hidden: { opacity: 0, y: -6, filter: "blur(3px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

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
}

const MorphContext = createContext<MorphContextValue | null>(null);

function useMorphContext(component: string) {
  const context = useContext(MorphContext);
  if (!context)
    throw new Error(`${component} must be used within <MorphSelect>`);
  return context;
}

export interface MorphSelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function MorphSelect({
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
      triggerId: `${baseId}-trigger`,
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
      disabled,
    ],
  );

  return (
    <MorphContext.Provider value={context}>
      <div ref={rootRef} className={cn("relative", className)}>
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
    <>
      <div
        aria-hidden
        inert
        className={cn(ROW, "invisible rounded-xl border border-border")}
      >
        {children}
        <ChevronDown className="h-4 w-4" />
      </div>
      <AnimatePresence initial={false} mode="popLayout">
        {!context.open ? (
          <motion.button
            key="trigger"
            layoutId={context.layoutId}
            type="button"
            id={context.triggerId}
            disabled={context.disabled}
            aria-haspopup="listbox"
            aria-expanded={false}
            aria-controls={context.listId}
            onClick={() => context.setOpen(true)}
            transition={context.reduce ? { duration: 0 } : MORPH}
            style={{ borderRadius: 12 }}
            className={cn(
              ROW,
              "absolute inset-x-0 top-0 z-10 border border-border bg-background text-foreground outline-none",
              "hover:border-(--color-border-strong) focus-visible:ring-2 focus-visible:ring-foreground/20",
              "disabled:pointer-events-none disabled:opacity-50",
              className,
            )}
          >
            <motion.span layout="position" className="min-w-0 truncate">
              {children}
            </motion.span>
            <motion.span layout="position" className="text-muted-foreground">
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </motion.button>
        ) : null}
      </AnimatePresence>
    </>
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
  const label = context.labelFor(context.value);
  
  // Clear search when opening/closing
  useEffect(() => {
    if (!context.open) {
      context.setSearchQuery("");
    }
  }, [context.open, context.setSearchQuery]);
  return (
    <>
      <div className="hidden">{children}</div>
      <AnimatePresence initial={false} mode="popLayout">
        {context.open ? (
          <motion.div
            key="panel"
            layoutId={context.layoutId}
            id={context.listId}
            role="listbox"
            aria-labelledby={context.triggerId}
            transition={context.reduce ? { duration: 0 } : MORPH}
            style={{ borderRadius: 12 }}
            className={cn(
              "absolute inset-x-0 top-0 z-30 overflow-hidden border border-border bg-background shadow-lg",
              className,
            )}
          >
            <motion.button
              type="button"
              layout="position"
              aria-expanded
              onClick={() => context.setOpen(false)}
              className={cn(ROW, "outline-none")}
            >
              <span
                className={cn(
                  "min-w-0 truncate",
                  label ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label ?? context.placeholder}
              </span>
              <motion.span
                animate={{ rotate: 180 }}
                transition={context.reduce ? { duration: 0 } : MORPH}
                className="text-muted-foreground"
              >
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            </motion.button>
            <div className="h-px bg-border" />
            {searchable && (
              <>
                <div className="px-3 py-2.5">
                  <input
                    autoFocus
                    type="text"
                    placeholder={searchPlaceholder}
                    value={context.searchQuery}
                    onChange={(e) => context.setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none border-none focus:ring-0 focus:outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <div className="h-px bg-border" />
              </>
            )}
            <motion.ul
              initial="hidden"
              animate="show"
              variants={context.reduce ? undefined : LIST}
              className="p-1 max-h-[200px] overflow-y-auto custom-scrollbar"
            >
              {children}
            </motion.ul>
          </motion.div>
        ) : null}
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

  if (context.searchQuery && !label.toLowerCase().includes(context.searchQuery.toLowerCase())) {
    return null;
  }

  return (
    <motion.li variants={context.reduce ? undefined : ITEM}>
      <button
        type="button"
        role="option"
        aria-selected={selected}
        disabled={disabled}
        onClick={() => context.select(value)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm outline-none",
          selected
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:bg-muted",
          "disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
      >
        {children}
        {selected ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
      </button>
    </motion.li>
  );
}

export default MorphSelect;
