import { type ReactNode, useState } from "react";
import { Heart, MapPin, Moon, Star, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import logoMark from "@/assets/images/civella-logo.jpg";
import { cn } from "@/utils/cn";
import { useUI } from "@/store";
import { useCountUp } from "@/hooks";
import { formatArea, formatCurrency, formatNumber } from "@/lib/format";
import type { ListingSummary, MarketStat, Theme } from "@/types";
import { Badge } from "@/components/ui";

// ── Logo ──────────────────────────────────────────────────────────────────
export function Logo({
  size = "md",
  showWord = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showWord?: boolean;
  className?: string;
}) {
  const dims = { sm: 7, md: 9, lg: 11 }[size];
  const text = { sm: "text-base", md: "text-lg", lg: "text-2xl" }[size];
  return (
    <span className={cn("flex select-none items-center gap-2.5", className)}>
      <span
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-line transition-transform duration-150 active:scale-[0.97]"
        style={{ width: dims * 4, height: dims * 4 }}
      >
        <img src={logoMark} alt="Civella" width={dims * 4} height={dims * 4} className="h-full w-full object-cover" />
      </span>
      {showWord && (
        <span className={cn("font-semibold tracking-tight text-strong", text)}>
          Civella
        </span>
      )}
    </span>
  );
}

// ── ThemeToggle (bounded animation — translateX inside overflow:hidden) ──
const ORDER: Theme[] = ["light", "system", "dark"];
const ICONS: Record<Theme, ReactNode> = {
  light: <Sun className="h-3.5 w-3.5" />,
  dark: <Moon className="h-3.5 w-3.5" />,
  system: <Monitor className="h-3.5 w-3.5" />,
};

function Monitor({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function ThemeToggle({ theme, onChange }: { theme: Theme; onChange: (t: Theme) => void }) {
  const activeIndex = ORDER.indexOf(theme);
  return (
    <div
      role="group"
      aria-label="Theme"
      className="relative flex h-9 w-[112px] items-center gap-0.5 overflow-hidden rounded-full border border-line bg-subtle p-0.5"
    >
      <span
        aria-hidden
        className="absolute top-0.5 bottom-0.5 left-0.5 w-[34px] rounded-full bg-surface shadow-base transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${activeIndex * 36}px)` }}
      />
      {ORDER.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          aria-pressed={theme === t}
          title={`Theme: ${t}`}
          className={cn(
            "relative z-10 flex h-8 w-[34px] items-center justify-center transition-colors duration-200",
            theme === t ? "text-accent" : "text-muted hover:text-soft",
          )}
        >
          {ICONS[t]}
        </button>
      ))}
    </div>
  );
}

// ── Toast viewport ─────────────────────────────────────────────────────────
export function ToastViewport() {
  const { toasts, dismissToast } = useUI();
  const tones: Record<string, string> = {
    success: "border-success/30 text-success",
    error: "border-error/30 text-error",
    info: "border-info/30 text-info",
    warning: "border-warning/30 text-warning",
  };
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-center gap-3 rounded-lg border bg-surface px-4 py-3 shadow-elevated",
            "animate-[slideIn_0.25s_ease-out]",
            tones[t.tone],
          )}
        >
          <span className="text-sm font-medium text-strong">{t.message}</span>
          <button
            onClick={() => dismissToast(t.id)}
            className="ml-auto text-muted hover:text-strong"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  );
}

// ── StatTile with count-up ────────────────────────────────────────────────
export function StatTile({ stat }: { stat: MarketStat }) {
  const v = useCountUp(stat.value, 1500);
  const display =
    stat.format === "currency"
      ? formatCurrency(Math.round(v), true)
      : stat.format === "days"
        ? `${Math.round(v)} days`
        : formatNumber(Math.round(v));
  const up = stat.deltaPct >= 0;
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-base">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{stat.label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-strong tnum">{display}</p>
      <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", up ? "text-success" : "text-error")}>
        {up ? "▲" : "▼"} {Math.abs(stat.deltaPct).toFixed(1)}%
        <span className="text-muted">vs last month</span>
      </p>
    </div>
  );
}

// ── ListingCard (PropertyCard) ────────────────────────────────────────────
export function ListingCard({ listing }: { listing: ListingSummary }) {
  const [saved, setSaved] = useState(false);
  const statusTone =
    listing.status === "active" ? "green" : listing.status === "pending" ? "gold" : listing.status === "sold" ? "muted" : "rose";
  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-base transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={listing.coverImage}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          <Badge tone={statusTone as "green" | "gold" | "muted" | "rose"}>{listing.status}</Badge>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setSaved((s) => !s);
          }}
          aria-label={saved ? "Unsave listing" : "Save listing"}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-muted backdrop-blur transition-colors hover:text-error"
        >
          <Heart className={cn("h-4 w-4", saved && "fill-error text-error")} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-lg font-semibold tracking-tight text-strong">{formatCurrency(listing.price)}</p>
        <p className="mt-0.5 line-clamp-1 text-sm font-medium text-soft">{listing.title}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3.5 w-3.5" /> {listing.areaId.replace(/-/g, " ")}
        </p>
        <div className="mt-3 flex items-center gap-4 border-t border-line pt-3 text-xs text-muted">
          {listing.beds > 0 && <span><b className="text-soft">{listing.beds}</b> bed</span>}
          {listing.baths > 0 && <span><b className="text-soft">{listing.baths}</b> bath</span>}
          <span className="ml-auto tnum">{formatArea(listing.sqft)}</span>
        </div>
      </div>
    </Link>
  );
}

// ── Simple stat / KPI card ───────────────────────────────────────────────
export function KpiCard({
  label,
  value,
  delta,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  delta?: string;
  icon: ReactNode;
  tone?: "blue" | "green" | "gold" | "rose";
}) {
  const tones: Record<string, string> = {
    blue: "bg-accent-soft text-accent",
    green: "bg-success/10 text-success",
    gold: "bg-warning/10 text-warning",
    rose: "bg-error/10 text-error",
  };
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-base">
      <div className="flex items-start justify-between">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", tones[tone])}>{icon}</span>
        {delta && <span className="text-xs font-medium text-success">{delta}</span>}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-strong tnum">{value}</p>
      <p className="mt-0.5 text-sm text-muted">{label}</p>
    </div>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("h-3.5 w-3.5", i < Math.round(rating) ? "fill-warning text-warning" : "text-line-strong")}
        />
      ))}
      <span className="ml-1 text-xs font-medium text-soft">{rating.toFixed(1)}</span>
    </span>
  );
}
