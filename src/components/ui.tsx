"use client";

import {
  useEffect,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { X } from "lucide-react";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ------------------------------------------------------------------ layout

export function Card({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-xl border border-edge bg-surface/80 shadow-lg shadow-black/20 backdrop-blur-sm",
        className,
      )}
    >
      {(title || actions || description) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-edge px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold tracking-tight text-zinc-100">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-zinc-400">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cx("px-4 py-4 sm:px-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "positive" | "warning" | "danger";
  icon?: ReactNode;
}) {
  const toneClass = {
    default: "text-zinc-50",
    positive: "text-emerald-300",
    warning: "text-amber-300",
    danger: "text-rose-300",
  }[tone];

  return (
    <div className="rounded-xl border border-edge bg-surface/80 px-4 py-3.5">
      <div className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-wider text-zinc-500">
        {icon}
        {label}
      </div>
      <div className={cx("mt-1.5 font-mono text-2xl font-semibold tabular-nums", toneClass)}>{value}</div>
      {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-edge-strong px-6 py-10 text-center">
      {icon && <div className="mb-3 text-zinc-600">{icon}</div>}
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      {description && <p className="mt-1 max-w-md text-xs text-zinc-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ----------------------------------------------------------------- controls

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ variant = "secondary", size = "md", className, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 border-emerald-400",
    secondary: "bg-surface-2 text-zinc-200 hover:bg-edge border-edge-strong",
    ghost: "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-surface-2 border-transparent",
    danger: "bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border-rose-500/40",
  }[variant];

  const sizes = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3 py-1.5 text-sm gap-2",
  }[size];

  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center rounded-lg border font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variants,
        sizes,
        className,
      )}
      {...props}
    />
  );
}

const controlClass =
  "rounded-lg border border-edge-strong bg-canvas/70 px-2.5 py-1.5 text-sm text-zinc-100 " +
  "placeholder:text-zinc-600 transition-colors focus:border-emerald-400/60 focus:outline-none " +
  "focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-50";

/**
 * Controls fill their container by default, but a caller passing its own width
 * must win. Tailwind resolves `w-full` vs `w-24` by stylesheet order rather
 * than the order classes appear in the attribute, so the default is dropped
 * rather than merely overridden.
 */
const widthClass = (className?: string) =>
  /(^|\s)(w-|min-w-|max-w-|flex-1|flex-auto|size-)/.test(className ?? "") ? "" : "w-full";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: (id: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cx("min-w-0", className)}>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-zinc-400">
        {label}
      </label>
      {children(id)}
      {hint && <p className="mt-1 text-[0.7rem] leading-relaxed text-zinc-500">{hint}</p>}
    </div>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(controlClass, widthClass(className), className)} {...props} />;
}

export function NumberInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      className={cx(controlClass, widthClass(className), "font-mono tabular-nums", className)}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(controlClass, widthClass(className), "appearance-none bg-surface-2", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} className={cx(controlClass, widthClass(className), "resize-y", className)} {...props} />;
}

export function Badge({
  children,
  className,
  tone,
}: {
  children: ReactNode;
  className?: string;
  tone?: "ok" | "tight" | "over" | "muted";
}) {
  const tones = {
    ok: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    tight: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    over: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    muted: "border-edge-strong bg-surface-2 text-zinc-400",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[0.7rem] font-medium",
        tone ? tones[tone] : "border-edge-strong bg-surface-2 text-zinc-300",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Utilisation bar. Values above 100% are drawn full and coloured red. */
export function Meter({
  value,
  max,
  label,
  detail,
}: {
  value: number;
  max: number;
  label: string;
  detail?: string;
}) {
  const ratio = max > 0 ? value / max : value > 0 ? Infinity : 0;
  const percent = Number.isFinite(ratio) ? Math.min(100, ratio * 100) : 100;
  const tone =
    ratio > 1 ? "bg-rose-400" : ratio >= 0.75 ? "bg-amber-400" : "bg-emerald-400";
  const text =
    ratio > 1 ? "text-rose-300" : ratio >= 0.75 ? "text-amber-300" : "text-zinc-400";

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-[0.7rem]">
        <span className="font-medium text-zinc-400">{label}</span>
        <span className={cx("font-mono tabular-nums", text)}>{detail}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas ring-1 ring-inset ring-edge">
        <div className={cx("h-full rounded-full transition-all", tone)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------- modal

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8">
      <div
        className="absolute inset-0"
        role="presentation"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          "relative my-auto w-full rounded-xl border border-edge-strong bg-surface shadow-2xl shadow-black/60",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-edge px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-zinc-400">{description}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </header>
        <div className="scroll-slim max-h-[65vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-edge px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
