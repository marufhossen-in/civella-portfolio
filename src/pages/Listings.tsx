import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BedDouble,
  Bath,
  Maximize,
  Calendar,
  ChevronLeft,
  Home,
  Mail,
  MapPin,
  Phone,
  PlayCircle,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { agents, listingSummaries, listings } from "@/data";
import { applyFilters } from "@/lib/api";
import { leadSchema, showingSchema, type LeadValues, type ShowingValues } from "@/lib/validation";
import { listingService } from "@/lib/api";
import { Badge, Button, Input, Select, Textarea, EmptyState } from "@/components/ui";
import { Avatar } from "@/components/ui";
import { ListingCard } from "@/components/shared";
import { useLeads, useSavedSearches, useUI } from "@/store";
import { formatArea, formatCurrency, formatNumber } from "@/lib/format";
import type { Coordinates, Listing, ListingFilters, ListingSummary, SortKey } from "@/types";
import { cn } from "@/utils/cn";

const DEFAULT_FILTERS: ListingFilters = {
  query: "",
  type: "any",
  minPrice: 0,
  maxPrice: 0,
  minBeds: 0,
  maxBeds: 0,
  minSqft: null,
  areaId: null,
  radiusMiles: null,
  sort: "newest",
};

const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "sqft-desc", label: "Largest" },
  { value: "dom-asc", label: "Fewest days listed" },
];

const TYPES = [
  { value: "any", label: "All types" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "apartment", label: "Apartment" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
];

function boundsOf(rows: ListingSummary[]) {
  const lats = rows.map((r) => r.coords.lat);
  const lngs = rows.map((r) => r.coords.lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

function project(c: Coordinates, b: ReturnType<typeof boundsOf>) {
  const x = ((c.lng - b.minLng) / (b.maxLng - b.minLng || 1)) * 100;
  const y = (1 - (c.lat - b.minLat) / (b.maxLat - b.minLat || 1)) * 100;
  return { x: Math.max(6, Math.min(94, x)), y: Math.max(8, Math.min(92, y)) };
}

function MapView({
  rows,
  selectedId,
  onSelect,
}: {
  rows: ListingSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const b = useMemo(() => boundsOf(listingSummaries), []);
  return (
    <div className="relative h-[420px] overflow-hidden rounded-xl border border-line bg-subtle lg:h-full grid-lines">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-soft/30 to-transparent" />
      {rows.map((r) => {
        const { x, y } = project(r.coords, b);
        const active = selectedId === r.id;
        return (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            className={cn(
              "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-[11px] font-semibold shadow-base transition-all duration-200",
              active
                ? "z-20 scale-110 bg-accent text-white"
                : "bg-surface text-strong hover:bg-accent hover:text-white",
            )}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {formatCurrency(r.price, true)}
          </button>
        );
      })}
      <div className="absolute bottom-3 left-3 rounded-md bg-surface/90 px-3 py-1.5 text-xs text-muted backdrop-blur">
        {rows.length} properties · drag to explore
      </div>
    </div>
  );
}

function FilterBar({
  filters,
  count,
  onChange,
  onReset,
}: {
  filters: ListingFilters;
  count: number;
  onChange: (f: ListingFilters) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-sm border border-line bg-canvas px-3">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Search by title or ID"
            className="h-10 w-full bg-transparent text-sm text-strong placeholder:text-muted focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            id="f-type"
            value={filters.type}
            options={TYPES}
            onChange={(e) => onChange({ ...filters, type: e.target.value as ListingFilters["type"] })}
            className="h-10 w-auto"
          />
          <Select
            id="f-beds"
            value={String(filters.minBeds)}
            options={[
              { value: "0", label: "Any beds" },
              { value: "1", label: "1+ beds" },
              { value: "2", label: "2+ beds" },
              { value: "3", label: "3+ beds" },
              { value: "4", label: "4+ beds" },
            ]}
            onChange={(e) => onChange({ ...filters, minBeds: Number(e.target.value) })}
            className="h-10 w-auto"
          />
          <Select
            id="f-sort"
            value={filters.sort}
            options={SORTS.map((s) => ({ value: s.value, label: s.label }))}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as SortKey })}
            className="h-10 w-auto"
          />
          <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
            <SlidersHorizontal className="h-4 w-4" /> Price
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <Input
            id="f-min"
            type="number"
            label="Min price"
            value={filters.minPrice || ""}
            onChange={(e) => onChange({ ...filters, minPrice: Number(e.target.value) })}
          />
          <Input
            id="f-max"
            type="number"
            label="Max price"
            value={filters.maxPrice || ""}
            onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          />
          <Select
            id="f-area"
            value={filters.areaId ?? ""}
            options={[
              { value: "", label: "All neighborhoods" },
              { value: "marina-bay", label: "Marina Bay" },
              { value: "oakhurst", label: "Oakhurst Heights" },
              { value: "downtown-west", label: "Downtown West" },
              { value: "cedar-hills", label: "Cedar Hills" },
            ]}
            onChange={(e) => onChange({ ...filters, areaId: e.target.value || null })}
          />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span><b className="text-strong">{count}</b> {count === 1 ? "result" : "results"} found</span>
        <button onClick={onReset} className="flex items-center gap-1 hover:text-accent">
          <X className="h-3.5 w-3.5" /> Reset filters
        </button>
      </div>
    </div>
  );
}

export function ListingsPage() {
  const [params, setParams] = useSearchParams();
  const { save } = useSavedSearches();
  const { toast } = useUI();

  const filters: ListingFilters = useMemo(
    () => ({
      ...DEFAULT_FILTERS,
      query: params.get("q") ?? "",
      type: (params.get("type") as ListingFilters["type"]) ?? "any",
      minPrice: Number(params.get("minPrice") ?? 0),
      maxPrice: Number(params.get("maxPrice") ?? 0),
      minBeds: Number(params.get("beds") ?? 0),
      areaId: params.get("area") ?? null,
      sort: (params.get("sort") as SortKey) ?? "newest",
    }),
    [params],
  );

  const results = useMemo(() => applyFilters(listingSummaries, filters), [filters]);
  const [selected, setSelected] = useState<string | null>(null);

  const onChange = (f: ListingFilters) => {
    const p = new URLSearchParams();
    if (f.query) p.set("q", f.query);
    if (f.type !== "any") p.set("type", f.type);
    if (f.minPrice) p.set("minPrice", String(f.minPrice));
    if (f.maxPrice) p.set("maxPrice", String(f.maxPrice));
    if (f.minBeds) p.set("beds", String(f.minBeds));
    if (f.areaId) p.set("area", f.areaId);
    if (f.sort !== "newest") p.set("sort", f.sort);
    setParams(p);
  };

  const onSaveSearch = () => {
    save(`${results.length} matching · ${filters.type}`, filters);
    toast("Search saved — we'll alert you on new matches.", "success");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-strong">Browse listings</h1>
          <p className="mt-1 text-muted">Filter, sort, and explore on the map — filters sync to the URL.</p>
        </div>
        <Button variant="outline" onClick={onSaveSearch}>
          Save this search
        </Button>
      </div>

      <div className="mt-6">
        <FilterBar filters={filters} count={results.length} onChange={onChange} onReset={() => setParams(new URLSearchParams())} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          {results.length === 0 ? (
            <EmptyState
              title="No matching listings"
              hint="Try widening your price range or clearing filters."
              actionLabel="Reset filters"
              onAction={() => setParams(new URLSearchParams())}
              icon={<Search className="h-6 w-6" />}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <MapView rows={results.length ? results : listingSummaries} selectedId={selected} onSelect={setSelected} />
        </div>
      </div>
    </div>
  );
}

// ── Spec grid + price chart ────────────────────────────────────────────────
function SpecGrid({ listing }: { listing: Listing }) {
  const specs = [
    [BedDouble, "Bedrooms", String(listing.beds)],
    [Bath, "Bathrooms", String(listing.baths)],
    [Maximize, "Interior", formatArea(listing.sqft)],
    [Home, "Lot", listing.lotSqft ? formatArea(listing.lotSqft) : "—"],
    [Calendar, "Year built", listing.yearBuilt ? String(listing.yearBuilt) : "—"],
    [MapPin, "Garage", listing.garage != null ? `${listing.garage} cars` : "—"],
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {specs.map(([Icon, label, value]) => (
        <div key={label} className="rounded-lg border border-line bg-surface p-4">
          <Icon className="h-5 w-5 text-accent" />
          <p className="mt-2 text-xs text-muted">{label}</p>
          <p className="text-sm font-semibold text-strong">{value}</p>
        </div>
      ))}
    </div>
  );
}

function PriceHistoryChart({ points }: { points: { at: string; price: number }[] }) {
  if (points.length < 2) {
    return <p className="text-sm text-muted">No price changes recorded for this listing.</p>;
  }
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 320;
  const h = 120;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => ({ x: i * step, y: h - ((p.price - min) / range) * (h - 20) - 10 }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 140 }}>
        <defs>
          <linearGradient id="ph" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L${w},${h} L0,${h} Z`} fill="url(#ph)" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3.5" fill="var(--accent)" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted">
        {points.map((p) => (
          <span key={p.at}>{new Date(p.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-sm">
        <span className="text-muted">Low <b className="text-strong tnum">{formatCurrency(min)}</b></span>
        <span className="text-muted">High <b className="text-strong tnum">{formatCurrency(max)}</b></span>
        <span className="text-success">↓ {formatCurrency(max - min)} adjusted</span>
      </div>
    </div>
  );
}

function LeadFormPanel({ listing }: { listing: Listing }) {
  const { toast } = useUI();
  const { addLead } = useLeads();
  const [sending, setSending] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadValues>({ resolver: zodResolver(leadSchema) });

  const onSubmit = async (values: LeadValues) => {
    setSending(true);
    await listingService.submitLead({
      ...values,
      propertyId: listing.id,
      source: "detail-page",
    });
    addLead({
      id: `ld-${Date.now()}`,
      ...values,
      propertyId: listing.id,
      source: "detail-page",
      status: "new",
      assignedAgentId: listing.agentId,
      createdAt: new Date().toISOString(),
    });
    setSending(false);
    reset();
    toast("Your message was sent to the listing agent.", "success");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Input id="lf-name" label="Name" error={errors.name?.message ?? null} {...register("name")} />
      <Input id="lf-email" type="email" label="Email" error={errors.email?.message ?? null} {...register("email")} />
      <Input id="lf-phone" type="tel" label="Phone" error={errors.phone?.message ?? null} {...register("phone")} />
      <Textarea id="lf-msg" label="Message" rows={3} error={errors.message?.message ?? null} {...register("message")} />
      <Button type="submit" block loading={sending}>Contact agent</Button>
    </form>
  );
}

function ShowingForm({ listing }: { listing: Listing }) {
  const { toast } = useUI();
  const [sending, setSending] = useState(false);
  const [slot, setSlot] = useState<"morning" | "afternoon">("morning");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShowingValues>({ resolver: zodResolver(showingSchema) });

  const onSubmit = async (values: ShowingValues) => {
    setSending(true);
    await listingService.submitShowing({ ...values, timeSlot: slot, listingId: listing.id, notes: values.notes ?? "" });
    setSending(false);
    toast("Showing requested — the agent will confirm shortly.", "success");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input id="sf-name" label="Name" error={errors.name?.message ?? null} {...register("name")} />
        <Input id="sf-phone" type="tel" label="Phone" error={errors.phone?.message ?? null} {...register("phone")} />
      </div>
      <Input id="sf-email" type="email" label="Email" error={errors.email?.message ?? null} {...register("email")} />
      <Input id="sf-date" type="date" label="Preferred date" error={errors.preferredDate?.message ?? null} {...register("preferredDate")} />
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-soft">Time of day</p>
        <div className="grid grid-cols-2 gap-2">
          {(["morning", "afternoon"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSlot(s)}
              className={cn(
                "rounded-sm border px-3 py-2 text-sm font-medium capitalize transition-colors",
                slot === s ? "border-accent bg-accent-soft text-accent" : "border-line text-soft hover:bg-subtle",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" block loading={sending}>Request showing</Button>
    </form>
  );
}

export function ListingDetailPage() {
  const { listingId } = useParams();
  const listing = useMemo(() => listings.find((l) => l.id === listingId) ?? null, [listingId]);
  const agent = useMemo(() => agents.find((a) => a.id === listing?.agentId) ?? null, [listing]);
  const [activeImg, setActiveImg] = useState(0);
  const [tab, setTab] = useState<"contact" | "showing">("contact");

  if (!listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          title="Listing not found"
          hint="This property may have been removed or the link is incorrect."
          actionLabel="Browse listings"
          onAction={() => (window.location.href = "/listings")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Link to="/listings" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent">
        <ChevronLeft className="h-4 w-4" /> Back to listings
      </Link>

      {/* Gallery */}
      <div className="mt-4 grid gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-line">
          <img src={listing.images[activeImg]?.url} alt={listing.title} className="aspect-[16/10] w-full object-cover" />
        </div>
        <div className="grid grid-cols-4 gap-3 lg:grid-cols-2">
          {listing.images.slice(0, 4).map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveImg(i)}
              className={cn(
                "overflow-hidden rounded-lg border-2 transition-colors",
                activeImg === i ? "border-accent" : "border-transparent",
              )}
            >
              <img src={img.url} alt={img.alt} className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.7fr_1fr]">
        {/* Left */}
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge tone={listing.status === "active" ? "green" : listing.status === "pending" ? "gold" : "muted"}>
                  {listing.status}
                </Badge>
                <span className="text-xs uppercase tracking-wide text-muted">{listing.type}</span>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-strong">{listing.title}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-muted">
                <MapPin className="h-4 w-4" /> {listing.address.street}, {listing.address.city}, {listing.address.state} {listing.address.zip}
              </p>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-strong tnum">{formatCurrency(listing.price)}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-6 border-y border-line py-4 text-sm text-soft">
            <span className="flex items-center gap-2"><BedDouble className="h-4 w-4 text-muted" /> {listing.beds || "—"} beds</span>
            <span className="flex items-center gap-2"><Bath className="h-4 w-4 text-muted" /> {listing.baths || "—"} baths</span>
            <span className="flex items-center gap-2"><Maximize className="h-4 w-4 text-muted" /> {formatArea(listing.sqft)}</span>
            <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted" /> {listing.daysOnMarket} days listed</span>
            {listing.virtualTourUrl && (
              <a href={listing.virtualTourUrl} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1.5 font-medium text-accent hover:underline">
                <PlayCircle className="h-4 w-4" /> Virtual tour
              </a>
            )}
          </div>

          <p className="mt-6 text-pretty leading-relaxed text-soft">{listing.description}</p>

          <h2 className="mt-8 text-lg font-semibold text-strong">Property details</h2>
          <div className="mt-3">
            <SpecGrid listing={listing} />
          </div>

          <h2 className="mt-8 text-lg font-semibold text-strong">Features</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {listing.features.map((f) => (
              <span key={f} className="rounded-full border border-line bg-subtle px-3 py-1 text-sm text-soft">{f}</span>
            ))}
          </div>

          <h2 className="mt-8 text-lg font-semibold text-strong">Price history</h2>
          <div className="mt-3 rounded-xl border border-line bg-surface p-5">
            <PriceHistoryChart points={listing.priceHistory} />
          </div>
        </div>

        {/* Right — contact / showing */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <Avatar name={agent?.name ?? "Agent"} src={agent?.photoUrl || undefined} size={48} />
              <div>
                <p className="text-sm font-semibold text-strong">{agent?.name}</p>
                <p className="text-xs text-muted">{agent?.title}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2 text-xs">
              <a href={`tel:${agent?.phone}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-line py-2 text-soft hover:bg-subtle">
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
              <a href={`mailto:${agent?.email}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-line py-2 text-soft hover:bg-subtle">
                <Mail className="h-3.5 w-3.5" /> Email
              </a>
            </div>

            <div className="mt-5 flex gap-1 rounded-lg bg-subtle p-1">
              {(["contact", "showing"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 rounded-md py-2 text-sm font-medium capitalize transition-colors",
                    tab === t ? "bg-surface text-strong shadow-base" : "text-muted hover:text-soft",
                  )}
                >
                  {t === "contact" ? "Message" : "Book showing"}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {tab === "contact" ? <LeadFormPanel listing={listing} /> : <ShowingForm listing={listing} />}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-surface p-4 text-sm">
            <span className="text-muted">Reference</span>
            <span className="font-mono text-strong">{listing.id}</span>
          </div>
          <p className="mt-3 text-center text-xs text-muted">{formatNumber(listing.sqft)} sqft listed on Civella</p>
        </div>
      </div>
    </div>
  );
}


