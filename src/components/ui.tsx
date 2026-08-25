import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useEffect,
} from "react";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { initials } from "@/lib/format";

// ── Button ────────────────────────────────────────────────────────────────
type ButtonProps = {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  block?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  block = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  const variants: Record<string, string> = {
    primary: "bg-accent text-white hover:bg-accent-hover shadow-base",
    outline: "border border-line-strong text-strong hover:bg-subtle bg-surface",
    ghost: "text-soft hover:bg-subtle hover:text-strong",
    danger: "bg-error text-white hover:brightness-110",
  };
  const sizes: Record<string, string> = {
    sm: "h-9 px-3.5 text-[13px]",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-7 text-[15px]",
  };
  return (
    <button
      className={cn(base, variants[variant], sizes[size], block && "w-full", className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

// ── Field wrapper + Input ─────────────────────────────────────────────────
type InputProps = {
  id: string;
  label?: string;
  error?: string | null;
  hint?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

export function Input({ id, label, error, hint, leftIcon, rightSlot, className, ...rest }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-soft">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {leftIcon}
          </span>
        )}
        <input
          id={id}
          className={cn(
            "h-11 w-full rounded-sm border bg-surface px-3.5 text-sm text-strong placeholder:text-muted transition-colors",
            "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
            leftIcon && "pl-10",
            rightSlot && "pr-10",
            error ? "border-error" : "border-line",
            className,
          )}
          aria-invalid={!!error}
          {...rest}
        />
        {rightSlot && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">{rightSlot}</span>}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-error">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Textarea({
  id,
  label,
  error,
  hint,
  className,
  ...rest
}: {
  id: string;
  label?: string;
  error?: string | null;
  hint?: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-soft">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          "w-full rounded-sm border bg-surface px-3.5 py-2.5 text-sm text-strong placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
          error ? "border-error" : "border-line",
          className,
        )}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-error">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────
type SelectProps = {
  id: string;
  label?: string;
  value: string;
  options: { value: string; label: string }[];
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "value">;

export function Select({ id, label, value, options, className, ...rest }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-soft">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          className={cn(
            "h-11 w-full appearance-none rounded-sm border border-line bg-surface px-3.5 pr-10 text-sm text-strong transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
            className,
          )}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────
export function Toggle({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  id?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        checked ? "bg-accent" : "bg-line-strong",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

// ── Radio / RadioCard ─────────────────────────────────────────────────────
export function RadioCard({
  active,
  onClick,
  title,
  description,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-md border p-4 text-left transition-all duration-200",
        active ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-line bg-surface hover:border-line-strong",
      )}
    >
      {icon && <span className="mt-0.5 text-accent">{icon}</span>}
      <span className="flex-1">
        <span className="flex items-center gap-2 text-sm font-semibold text-strong">{title}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          active ? "border-accent bg-accent" : "border-line-strong",
        )}
      >
        {active && <Check className="h-3 w-3 text-white" />}
      </span>
    </button>
  );
}

// ── Checkbox ──────────────────────────────────────────────────────────────
export function Checkbox({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  id: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm text-soft">
      <span
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
          checked ? "border-accent bg-accent text-white" : "border-line-strong bg-surface",
        )}
      >
        {checked && <Check className="h-3.5 w-3.5" />}
      </span>
      <span className="select-none leading-snug">{label}</span>
    </label>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────
type Tone = "gold" | "green" | "cyan" | "rose" | "muted" | "blue";
export function Badge({ tone = "muted", children }: { tone?: Tone; children: ReactNode }) {
  const tones: Record<Tone, string> = {
    gold: "bg-warning/10 text-warning",
    green: "bg-success/10 text-success",
    cyan: "bg-info/10 text-info",
    rose: "bg-error/10 text-error",
    muted: "bg-subtle text-muted",
    blue: "bg-accent-soft text-accent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────
export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-accent-soft font-semibold text-accent",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("animate-pulse rounded-md bg-subtle", className)} style={style} />;
}

// ── Modal ─────────────────────────────────────────────────────────────────
export function Modal({
  open,
  title,
  onClose,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 w-full rounded-xl border border-line bg-surface shadow-elevated",
          maxWidth,
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="text-base font-semibold text-strong">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-subtle hover:text-strong"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "primary",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: "primary" | "danger";
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose} maxWidth="max-w-md">
      <p className="text-sm text-soft">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant={tone} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────
export function EmptyState({
  title,
  hint,
  actionLabel,
  onAction,
  icon,
  className,
}: {
  title: string;
  hint: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface px-6 py-16 text-center", className)}>
      {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">{icon}</div>}
      <h3 className="text-base font-semibold text-strong">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>
      {actionLabel && onAction && (
        <Button size="sm" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// ── LoadingState / ErrorState ─────────────────────────────────────────────
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
      <Loader2 className="h-7 w-7 animate-spin text-accent" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-error/20 bg-error/5 px-6 py-16 text-center">
      <p className="text-sm font-medium text-error">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line no-scrollbar">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors",
            active === t.id ? "text-accent" : "text-muted hover:text-soft",
          )}
        >
          {t.label}
          {typeof t.count === "number" && (
            <span className="ml-1.5 rounded-full bg-subtle px-1.5 py-0.5 text-[11px] text-soft">{t.count}</span>
          )}
          {active === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
        </button>
      ))}
    </div>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted">
      {items.map((it, i) => (
        <span key={it.label} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-line-strong">/</span>}
          {it.href ? (
            <a href={it.href} className="transition-colors hover:text-accent">
              {it.label}
            </a>
          ) : (
            <span className="text-soft">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ── Tooltip (simple CSS) ─────────────────────────────────────────────────
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span className="pointer-events-none absolute -top-9 left-1/2 z-50 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-strong px-2 py-1 text-[11px] font-medium text-canvas opacity-0 transition-all duration-150 group-hover/tt:translate-y-0 group-hover/tt:opacity-100">
        {label}
      </span>
    </span>
  );
}

// ── Section heading helper ───────────────────────────────────────────────
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
      <span className="h-px w-6 bg-accent" />
      {children}
    </span>
  );
}
