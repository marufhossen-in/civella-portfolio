import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  Crown,
  Inbox,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { agents, listings } from "@/data";
import { Badge, Button, EmptyState, Input, Select, Textarea } from "@/components/ui";
import { Avatar } from "@/components/ui";
import { KpiCard as Kpi } from "@/components/shared";
import { useAuth, useLeads, useUI } from "@/store";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import type { LeadStatus, LeadTab, ListingStatus, ListingType } from "@/types";
import { cn } from "@/utils/cn";

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-strong">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const FREE_LISTING_CAP = 10;

const TREND = [38, 52, 44, 61, 73, 82];
function MiniTrend() {
  const w = 320;
  const h = 90;
  const max = Math.max(...TREND);
  const step = w / (TREND.length - 1);
  const pts = TREND.map((v, i) => ({ x: i * step, y: h - (v / max) * (h - 12) - 6 }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 w-full" preserveAspectRatio="none" style={{ height: 96 }}>
      <defs>
        <linearGradient id="trendfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill="url(#trendfill)" />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--accent)" />
      ))}
    </svg>
  );
}

function GoalBar({ label, value, max, tone = "var(--accent)" }: { label: string; value: number; max: number; tone?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-soft">{label}</span>
        <span className="font-medium text-strong tnum">{value}/{max}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-subtle">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: tone }} />
      </div>
    </div>
  );
}

function PlanBadge() {
  const { user } = useAuth();
  const isPro = user?.plan === "pro" || user?.plan === "enterprise";
  return isPro ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
      <Crown className="h-3 w-3" /> {user?.plan === "enterprise" ? "Enterprise" : "Professional"}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-subtle px-3 py-1 text-xs font-medium text-muted">Free Plan</span>
  );
}

function UpgradeBanner() {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl border border-accent/30 bg-accent-soft/40 p-4 sm:flex-row sm:items-center">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Zap className="h-5 w-5" />
      </span>
      <div className="flex-1">
        <p className="font-semibold text-strong">You're on the free Starter plan</p>
        <p className="mt-0.5 text-sm text-soft">Upgrade to Professional for unlimited listings, AI lead intelligence, showing scheduler and priority support.</p>
      </div>
      <Link to="/pricing" className="shrink-0">
        <Button size="sm"><Crown className="h-3.5 w-3.5" /> Upgrade now</Button>
      </Link>
    </div>
  );
}

function LockedCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-surface p-5">
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface/80 backdrop-blur-sm">
        <Lock className="h-5 w-5 text-muted" />
        <p className="text-sm font-medium text-soft">Pro feature</p>
        <Link to="/pricing"><Button size="sm" variant="outline">Upgrade to unlock</Button></Link>
      </div>
      <h3 className="font-semibold text-strong opacity-40">{title}</h3>
      <p className="mt-1 text-sm text-muted opacity-40">{description}</p>
      <div className="mt-4 h-20 animate-pulse rounded-md bg-subtle opacity-40" />
    </div>
  );
}

// ── Dashboard (plan-aware) ────────────────────────────────────────────────
export function AgentDashboardPage() {
  const { user } = useAuth();
  const { leads } = useLeads();
  const isPro = user?.plan === "pro" || user?.plan === "enterprise";

  const myLeads = leads.filter((l) => l.assignedAgentId === user?.id || l.assignedAgentId === null);
  const newLeads = myLeads.filter((l) => l.status === "new");
  const contacted = myLeads.filter((l) => l.status === "contacted");
  const recent = myLeads.slice(0, 5);

  const allListings = listings;
  const myListings = isPro ? allListings.slice(0, 8) : allListings.slice(0, FREE_LISTING_CAP);
  const activeCount = myListings.filter((l) => l.status === "active").length;
  const listingCapReached = !isPro && allListings.length >= FREE_LISTING_CAP;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name.split(" ")[0]}`}
        subtitle={isPro ? "Here's what's happening across your pipeline today." : "You're on the free Starter plan — 10 listings included."}
        action={
          <div className="flex items-center gap-2">
            <PlanBadge />
            {!listingCapReached && (
              <Link to="/agent/listings/new"><Button size="sm"><Plus className="h-4 w-4" /> New listing</Button></Link>
            )}
          </div>
        }
      />

      {!isPro && <UpgradeBanner />}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Active listings" value={`${activeCount}${!isPro ? ` / ${FREE_LISTING_CAP}` : ""}`} delta="+2 this week" icon={<Building2 className="h-5 w-5" />} tone="blue" />
        <Kpi label="New leads" value={String(newLeads.length)} delta="+11%" icon={<Inbox className="h-5 w-5" />} tone="green" />
        {isPro ? (
          <Kpi label="Showings this week" value="7" delta="-4%" icon={<CalendarClock className="h-5 w-5" />} tone="gold" />
        ) : (
          <div className="relative rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-muted" />
              <span className="text-sm text-muted">Showing scheduler</span>
              <Lock className="ml-auto h-4 w-4 text-muted" />
            </div>
            <p className="mt-2 text-xs text-muted">Pro feature — upgrade to schedule showings</p>
          </div>
        )}
        <Kpi label="Avg. days on market" value="23" delta="-8%" icon={<TrendingUp className="h-5 w-5" />} tone="rose" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent leads */}
          <div className="rounded-lg border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold text-strong">Recent leads</h2>
              <Link to="/agent/leads" className="flex items-center gap-1 text-sm text-accent hover:underline">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="divide-y divide-line">
              {recent.map((l) => (
                <Link key={l.id} to="/agent/leads" className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-subtle">
                  <Avatar name={l.name} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-strong">{l.name}</p>
                    <p className="truncate text-xs text-muted">{l.message}</p>
                  </div>
                  <Badge tone={l.status === "new" ? "green" : l.status === "closed" ? "muted" : "blue"}>{l.status}</Badge>
                  <span className="hidden text-xs text-muted sm:block">{formatRelativeTime(l.createdAt)}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* My listings */}
          <div className="rounded-lg border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-strong">My listings</h2>
                {isPro ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent"><Crown className="h-2.5 w-2.5" /> Unlimited</span>
                ) : (
                  <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">{myListings.length}/{FREE_LISTING_CAP} used</span>
                )}
              </div>
              <Link to="/agent/listings" className="flex items-center gap-1 text-sm text-accent hover:underline">Manage <ChevronRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="divide-y divide-line">
              {myListings.slice(0, 4).map((l) => (
                <Link key={l.id} to={`/agent/listings/${l.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-subtle">
                  <img src={l.images[0]?.url} alt="" className="h-10 w-14 rounded-sm object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-strong">{l.title}</p>
                    <p className="truncate text-xs text-muted">{l.address.street}</p>
                  </div>
                  <span className="text-sm font-semibold text-strong tnum">{formatCurrency(l.price, true)}</span>
                  <Badge tone={l.status === "active" ? "green" : l.status === "pending" ? "gold" : "muted"}>{l.status}</Badge>
                </Link>
              ))}
            </div>
            {listingCapReached && (
              <div className="border-t border-line bg-warning/5 px-5 py-3">
                <p className="text-sm font-medium text-warning">Listing cap reached ({FREE_LISTING_CAP}/{FREE_LISTING_CAP}). <Link to="/pricing" className="underline">Upgrade to Pro</Link> for unlimited listings.</p>
              </div>
            )}
          </div>

          {/* AI Lead Intelligence — Pro only */}
          {isPro ? (
            <div className="rounded-lg border border-line bg-surface">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="flex items-center gap-2 font-semibold text-strong"><BarChart3 className="h-4 w-4 text-accent" /> AI Lead Intelligence</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white"><Crown className="h-2.5 w-2.5" /> Pro</span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-4">
                  {[["Hot leads", "3", "var(--success)"], ["Warm leads", "5", "var(--warning)"], ["Cool leads", "4", "var(--text-muted)"]].map(([label, value, color]) => (
                    <div key={label} className="rounded-md border border-line p-3 text-center">
                      <span className="mx-auto mb-1 block h-2.5 w-2.5 rounded-full" style={{ background: color as string }} />
                      <p className="text-lg font-semibold text-strong">{value}</p>
                      <p className="text-xs text-muted">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <LockedCard title="AI Lead Intelligence" description="Automatically score and route leads by conversion probability." />
          )}

          {/* Performance trend */}
          <div className="rounded-lg border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-strong">Closed volume · 6 months</h2>
              <span className="text-xs font-medium text-success">▲ 12.4% YoY</span>
            </div>
            <MiniTrend />
            <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3 text-center">
              <div><p className="text-base font-semibold text-strong tnum">$82M</p><p className="text-[11px] text-muted">YTD volume</p></div>
              <div><p className="text-base font-semibold text-strong tnum">28</p><p className="text-[11px] text-muted">Closings</p></div>
              <div><p className="text-base font-semibold text-strong tnum">98%</p><p className="text-[11px] text-muted">Ask-to-sale</p></div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Pipeline snapshot */}
          <div className="rounded-lg border border-line bg-surface p-5">
            <h3 className="flex items-center gap-2 font-semibold text-strong"><TrendingUp className="h-4 w-4 text-accent" /> Pipeline snapshot</h3>
            <div className="mt-4 space-y-3">
              {[["New", newLeads.length, "var(--success)"], ["Contacted", contacted.length, "var(--info)"], ["Showings booked", leads.filter((l) => l.status === "showing-booked").length, "var(--warning)"], ["Closed", leads.filter((l) => l.status === "closed").length, "var(--text-muted)"]].map(([label, value, color]) => (
                <div key={label as string} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: color as string }} />
                  <span className="flex-1 text-sm text-soft">{label as string}</span>
                  <span className="text-sm font-semibold text-strong">{value as number}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quarterly goals */}
          <div className="rounded-lg border border-line bg-surface p-5">
            <h3 className="font-semibold text-strong">Quarterly goals</h3>
            <div className="mt-4 space-y-3">
              <GoalBar label="Closings" value={18} max={25} />
              <GoalBar label="New listings" value={12} max={15} tone="var(--info)" />
              <GoalBar label="Lead response < 1h" value={42} max={50} tone="var(--success)" />
            </div>
          </div>

          {/* This week — Pro only */}
          {isPro ? (
            <div className="rounded-lg border border-line bg-surface p-5">
              <h3 className="flex items-center gap-2 font-semibold text-strong"><CalendarClock className="h-4 w-4 text-accent" /> This week</h3>
              <div className="mt-4 space-y-3 text-sm">
                {[["Tue", "10:00", "Showing · Glasshouse on the Bluff"], ["Wed", "14:30", "Open house · Mariner Penthouse"], ["Fri", "09:00", "Listing photo shoot · Oakhurst Modernist"]].map(([day, time, title], i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex w-12 shrink-0 flex-col items-center rounded-md bg-subtle py-1">
                      <span className="text-[10px] uppercase text-muted">{day}</span>
                      <span className="text-xs font-semibold text-strong">{time}</span>
                    </div>
                    <p className="text-soft">{title}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-line p-5 text-center">
              <CalendarClock className="mx-auto h-8 w-8 text-muted/40" />
              <p className="mt-2 text-sm font-medium text-soft">Showing Scheduler</p>
              <p className="mt-1 text-xs text-muted">Available on the Professional plan</p>
              <Link to="/pricing" className="mt-3 inline-block"><Button size="sm" variant="outline"><Lock className="h-3.5 w-3.5" /> Unlock</Button></Link>
            </div>
          )}

          {/* Team (Pro) / Upgrade CTA (free) */}
          {isPro ? (
            <div className="rounded-lg border border-line bg-surface p-5">
              <Users className="h-5 w-5 text-accent" />
              <h3 className="mt-2 font-semibold text-strong">Your team</h3>
              <p className="mt-1 text-sm text-soft">1 of 5 seats in use.</p>
              <Link to="/agent/settings"><Button variant="outline" size="sm" className="mt-3">Manage team</Button></Link>
            </div>
          ) : (
            <div className="rounded-lg border border-accent/30 bg-accent-soft/20 p-5">
              <Crown className="h-5 w-5 text-accent" />
              <h3 className="mt-2 font-semibold text-strong">Go Professional</h3>
              <ul className="mt-2 space-y-1 text-xs text-soft">
                {["Unlimited listings", "AI lead scoring", "Showing scheduler", "5 user seats"].map((f) => (
                  <li key={f} className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success" /> {f}</li>
                ))}
              </ul>
              <Link to="/pricing"><Button size="sm" block className="mt-4">Upgrade</Button></Link>
            </div>
          )}

          {/* Quick actions */}
          <div className="rounded-lg border border-line bg-surface p-5">
            <h3 className="font-semibold text-strong">Quick actions</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/agent/listings"><Button variant="outline" size="sm" block>Listings</Button></Link>
              <Link to="/agent/leads"><Button variant="outline" size="sm" block>Leads</Button></Link>
              <Link to="/agent/profile"><Button variant="outline" size="sm" block>Profile</Button></Link>
              <Link to="/agent/settings"><Button variant="outline" size="sm" block>Settings</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Listings management ───────────────────────────────────────────────────
const STATUS_OPTIONS: ListingStatus[] = ["active", "pending", "sold", "withdrawn"];

export function AgentListingsPage() {
  const { user } = useAuth();
  const { toast } = useUI();
  const navigate = useNavigate();
  const [rows, setRows] = useState(listings);
  const isPro = user?.plan === "pro" || user?.plan === "enterprise";
  const atCap = !isPro && rows.length >= FREE_LISTING_CAP;

  const cycleStatus = (id: string) => {
    setRows((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const next = STATUS_OPTIONS[(STATUS_OPTIONS.indexOf(l.status) + 1) % STATUS_OPTIONS.length];
        if (!next) return l;
        toast(`"${l.title}" marked ${next}.`, "info");
        return { ...l, status: next };
      }),
    );
  };

  return (
    <div>
      <PageHeader
        title="My listings"
        subtitle="Manage status, edit details, and publish."
        action={
          <Link to={atCap ? "/pricing" : "/agent/listings/new"}>
            <Button>
              {atCap ? <><Lock className="h-4 w-4" /> Upgrade to add</> : <><Plus className="h-4 w-4" /> New listing</>}
            </Button>
          </Link>
        }
      />

      {!isPro && (
        <div className={cn("mb-4 flex items-center justify-between rounded-lg border px-4 py-3 text-sm", atCap ? "border-warning/40 bg-warning/5 text-warning" : "border-line bg-surface text-soft")}>
          <span><strong>{Math.min(rows.length, FREE_LISTING_CAP)}/{FREE_LISTING_CAP}</strong> listings used on the Free plan{atCap ? " — cap reached" : ""}</span>
          <Link to="/pricing"><Button size="sm" variant={atCap ? "primary" : "outline"}><Crown className="h-3.5 w-3.5" /> {atCap ? "Upgrade to continue" : "Unlimited"}</Button></Link>
        </div>
      )}
      {isPro && <p className="mb-4 text-sm text-muted">{rows.length} listings · <span className="inline-flex items-center gap-1 font-medium text-accent"><Crown className="h-3 w-3" /> Unlimited plan</span></p>}

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-subtle text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Property</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Type</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((l) => (
              <tr key={l.id} className="hover:bg-subtle/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={l.images[0]?.url} alt="" className="h-10 w-14 rounded-md object-cover" />
                    <div className="min-w-0">
                      <Link to={`/listings/${l.id}`} className="block truncate font-medium text-strong hover:text-accent">{l.title}</Link>
                      <p className="flex items-center gap-1 text-xs text-muted"><MapPin className="h-3 w-3" /> {l.address.areaId.replace(/-/g, " ")}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 capitalize text-soft sm:table-cell">{l.type}</td>
                <td className="px-4 py-3 font-medium text-strong tnum">{formatCurrency(l.price)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => cycleStatus(l.id)} title="Click to change status">
                    <Badge tone={l.status === "active" ? "green" : l.status === "pending" ? "gold" : l.status === "sold" ? "muted" : "rose"}>{l.status}</Badge>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => navigate(`/agent/listings/${l.id}`)} className="rounded-md p-2 text-muted hover:bg-subtle hover:text-accent" title="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => { setRows((p) => p.filter((x) => x.id !== l.id)); toast("Listing removed.", "info"); }} className="rounded-md p-2 text-muted hover:bg-subtle hover:text-error" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Listing editor ────────────────────────────────────────────────────────
const TYPES: ListingType[] = ["house", "apartment", "condo", "townhouse", "land", "commercial"];

export function ListingEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useUI();
  const existing = id && id !== "new" ? listings.find((l) => l.id === id) : null;
  const isNew = !existing;

  const [form, setForm] = useState({
    title: existing?.title ?? "",
    type: existing?.type ?? ("house" as ListingType),
    status: existing?.status ?? ("active" as ListingStatus),
    price: existing?.price ?? 0,
    beds: existing?.beds ?? 3,
    baths: existing?.baths ?? 2,
    sqft: existing?.sqft ?? 2000,
    description: existing?.description ?? "",
    virtualTourUrl: existing?.virtualTourUrl ?? "",
    features: existing?.features.join(", ") ?? "",
  });

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    toast(isNew ? "Listing created as draft." : "Listing updated successfully.", "success");
    navigate("/agent/listings");
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title={isNew ? "Create listing" : "Edit listing"} subtitle="Drafts are saved locally. Publish when ready." action={<Link to="/agent/listings"><Button variant="outline">Cancel</Button></Link>} />
      <form onSubmit={save} className="space-y-4 rounded-xl border border-line bg-surface p-6">
        <Input id="le-title" label="Title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Glasshouse on the Bluff" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Select id="le-type" label="Type" value={form.type} options={TYPES.map((t) => ({ value: t, label: t }))} onChange={(e) => set("type", e.target.value as ListingType)} />
          <Select id="le-status" label="Status" value={form.status} options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} onChange={(e) => set("status", e.target.value as ListingStatus)} />
          <Input id="le-price" type="number" label="Price (USD)" value={form.price} onChange={(e) => set("price", Number(e.target.value))} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input id="le-beds" type="number" label="Beds" value={form.beds} onChange={(e) => set("beds", Number(e.target.value))} />
          <Input id="le-baths" type="number" label="Baths" value={form.baths} onChange={(e) => set("baths", Number(e.target.value))} />
          <Input id="le-sqft" type="number" label="Sqft" value={form.sqft} onChange={(e) => set("sqft", Number(e.target.value))} />
        </div>
        <Textarea id="le-desc" label="Description" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
        <Input id="le-features" label="Features (comma separated)" value={form.features} onChange={(e) => set("features", e.target.value)} placeholder="Ocean Views, Smart Home, Pool" />
        <Input id="le-tour" label="Virtual tour URL" value={form.virtualTourUrl} onChange={(e) => set("virtualTourUrl", e.target.value)} placeholder="https://…" hint="Leave empty if no virtual tour is available." />
        <div className="flex justify-end gap-3 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={() => navigate("/agent/listings")}>Discard</Button>
          <Button type="submit">{isNew ? "Create draft" : "Save changes"}</Button>
        </div>
      </form>
    </div>
  );
}

// ── Lead inbox ────────────────────────────────────────────────────────────
const STATUS_FLOW: LeadStatus[] = ["new", "contacted", "showing-booked", "closed"];
const TABS: { id: LeadTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "showing-booked", label: "Showings" },
  { id: "closed", label: "Closed" },
];

export function LeadInboxPage() {
  const { leads, setStatus, assign } = useLeads();
  const { toast } = useUI();
  const [tab, setTab] = useState<LeadTab>("all");
  const [activeId, setActiveId] = useState<string | null>(leads[0]?.id ?? null);
  const [reply, setReply] = useState("");

  const counts = useMemo(() => {
    const c: Record<LeadTab, number> = { all: leads.length, new: 0, contacted: 0, "showing-booked": 0, closed: 0 };
    leads.forEach((l) => { c[l.status] += 1; });
    return c;
  }, [leads]);

  const filtered = tab === "all" ? leads : leads.filter((l) => l.status === tab);
  const active = leads.find((l) => l.id === activeId) ?? filtered[0] ?? null;

  const sendReply = () => {
    if (!reply.trim() || !active) return;
    toast(`Reply sent to ${active.name}.`, "success");
    setReply("");
    if (active.status === "new") setStatus(active.id, "contacted");
  };

  return (
    <div>
      <PageHeader title="Lead inbox" subtitle="Reply, assign, and move leads through your pipeline." />
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line no-scrollbar">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("relative whitespace-nowrap px-4 py-2.5 text-sm font-medium", tab === t.id ? "text-accent" : "text-muted hover:text-soft")}>
            {t.label} <span className="ml-1 text-xs">({counts[t.id]})</span>
            {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* List */}
        <div className="space-y-2 overflow-hidden rounded-xl border border-line bg-surface">
          {filtered.length === 0 ? (
            <div className="p-6"><EmptyState title="No leads here" hint="Leads in this status will appear here." icon={<Inbox className="h-6 w-6" />} /></div>
          ) : (
            filtered.map((l) => (
              <button key={l.id} onClick={() => setActiveId(l.id)} className={cn("flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-0 transition-colors", active?.id === l.id ? "bg-accent-soft/50" : "hover:bg-subtle")}>
                <Avatar name={l.name} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-strong">{l.name}</p>
                  <p className="truncate text-xs text-muted">{l.message}</p>
                </div>
                <Badge tone={l.status === "new" ? "green" : l.status === "closed" ? "muted" : "blue"}>{l.status}</Badge>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        {active ? (
          <div className="rounded-xl border border-line bg-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={active.name} size={48} />
                <div>
                  <p className="text-lg font-semibold text-strong">{active.name}</p>
                  <p className="text-sm text-muted">{active.email} · {active.phone}</p>
                </div>
              </div>
              <Badge tone="muted">{active.source}</Badge>
            </div>
            <div className="mt-4 rounded-lg bg-subtle p-4 text-sm text-soft">{active.message}</div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted">Status</p>
                <Select id="lead-status" value={active.status} options={STATUS_FLOW.map((s) => ({ value: s, label: s }))} onChange={(e) => { setStatus(active.id, e.target.value as LeadStatus); toast("Lead status updated.", "success"); }} />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted">Assign to</p>
                <Select id="lead-assign" value={active.assignedAgentId ?? ""} options={agents.map((a) => ({ value: a.id, label: a.name }))} onChange={(e) => { assign(active.id, e.target.value); toast("Lead assigned.", "success"); }} />
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-1.5 text-xs font-medium text-muted">Reply</p>
              <div className="flex gap-2">
                <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" className="h-11 flex-1 rounded-sm border border-line bg-canvas px-3.5 text-sm text-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
                <Button onClick={sendReply}><Mail className="h-4 w-4" /> Send</Button>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState title="Select a lead" hint="Choose a lead from the list to view details." icon={<Inbox className="h-6 w-6" />} />
        )}
      </div>
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────
export function NotificationsPage() {
  const items = [
    { tone: "green", title: "New lead: Hannah Brooks", body: "Interested in Glasshouse on the Bluff.", at: "2m ago" },
    { tone: "blue", title: "Showing booked", body: "Cedar Ridge Estate · Thursday 10:00 AM.", at: "1h ago" },
    { tone: "gold", title: "Price suggestion", body: "Promenade Penthouse is 4% above comparables.", at: "3h ago" },
    { tone: "muted", title: "Weekly report ready", body: "Your performance summary is available.", at: "1d ago" },
  ] as const;
  return (
    <div>
      <PageHeader title="Notifications" subtitle="Activity across your listings and leads." />
      <div className="space-y-2">
        {items.map((n) => (
          <div key={n.title} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: n.tone === "green" ? "var(--success)" : n.tone === "blue" ? "var(--accent)" : n.tone === "gold" ? "var(--warning)" : "var(--text-muted)" }} />
            <div className="flex-1">
              <p className="text-sm font-medium text-strong">{n.title}</p>
              <p className="text-sm text-muted">{n.body}</p>
            </div>
            <span className="text-xs text-muted">{n.at}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Admin ─────────────────────────────────────────────────────────────────
export function AdminPage() {
  const total = listings.length;
  const active = listings.filter((l) => l.status === "active").length;
  const pending = listings.filter((l) => l.status === "pending").length;
  const sold = listings.filter((l) => l.status === "sold").length;
  return (
    <div>
      <PageHeader title="Admin overview" subtitle="Brokerage-wide listing and agent oversight." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total listings" value={String(total)} icon={<Building2 className="h-5 w-5" />} tone="blue" />
        <Kpi label="Active" value={String(active)} icon={<TrendingUp className="h-5 w-5" />} tone="green" />
        <Kpi label="Pending" value={String(pending)} icon={<CalendarClock className="h-5 w-5" />} tone="gold" />
        <Kpi label="Agents" value={String(agents.length)} icon={<Users className="h-5 w-5" />} tone="rose" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface">
          <h2 className="border-b border-line px-5 py-4 font-semibold text-strong">Agent roster</h2>
          <div className="divide-y divide-line">
            {agents.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={a.name} size={38} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-strong">{a.name}</p>
                  <p className="text-xs text-muted">{a.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-strong tnum">{a.listingsCount}</p>
                  <p className="text-[11px] text-muted">listings</p>
                </div>
                {sold > 0 && <Badge tone="muted">active</Badge>}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-surface">
          <h2 className="border-b border-line px-5 py-4 font-semibold text-strong">Inventory by status</h2>
          <div className="space-y-3 p-5">
            {[
              ["Active", active, "var(--success)"],
              ["Pending", pending, "var(--warning)"],
              ["Sold", sold, "var(--text-muted)"],
            ].map(([label, val, color]) => (
              <div key={label as string}>
                <div className="mb-1 flex justify-between text-sm"><span className="text-soft">{label as string}</span><span className="font-medium text-strong">{val as number}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-subtle">
                  <div className="h-full rounded-full" style={{ width: `${((val as number) / total) * 100}%`, background: color as string }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
