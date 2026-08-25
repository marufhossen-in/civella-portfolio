import { type FormEvent, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Building2,
  ChevronDown,
  Compass,
  Footprints,
  Home,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { agents, listingSummaries, listings, neighborhoods } from "@/data";
import { listingService } from "@/lib/api";
import { Badge, Button, EmptyState, Input, SectionLabel } from "@/components/ui";
import { Avatar } from "@/components/ui";
import { ListingCard, Stars } from "@/components/shared";
import { Reveal } from "@/components/Reveal";
import { useUI } from "@/store";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { ValuationEstimate } from "@/types";
import { cn } from "@/utils/cn";

function PageHero({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionLabel>{label}</SectionLabel>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-strong sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-muted">{subtitle}</p>
      </div>
    </div>
  );
}

// ── Neighborhoods ─────────────────────────────────────────────────────────
export function NeighborhoodsPage() {
  return (
    <div>
      <PageHero
        label="Neighborhoods"
        title="Explore the city, area by area"
        subtitle="Curated guides with median prices, walk scores, and live inventory for every district."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Reveal className="grid gap-6 md:grid-cols-2" stagger={0.08}>
          {neighborhoods.map((n) => (
            <Link
              key={n.id}
              to={`/neighborhoods/${n.id}`}
              className="group flex overflow-hidden rounded-xl border border-line bg-surface shadow-base transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="relative w-2/5 shrink-0 overflow-hidden">
                <img src={n.image} alt={n.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex-1 p-5">
                <h3 className="flex items-center gap-1.5 text-lg font-semibold text-strong">
                  <MapPin className="h-4 w-4 text-accent" /> {n.name}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted">{n.blurb}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
                  <div>
                    <p className="text-sm font-semibold text-strong tnum">${(n.medianPrice / 1000).toFixed(0)}k</p>
                    <p className="text-[10px] uppercase text-muted">Median</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-strong">{n.avgDaysOnMarket}d</p>
                    <p className="text-[10px] uppercase text-muted">On market</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-strong">{n.walkScore}</p>
                    <p className="text-[10px] uppercase text-muted">Walk</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </Reveal>
      </div>
    </div>
  );
}

export function NeighborhoodPage() {
  const { areaId } = useParams();
  const area = neighborhoods.find((n) => n.id === areaId);
  const results = useMemo(() => listingSummaries.filter((l) => l.areaId === areaId), [areaId]);

  if (!area) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState title="Area not found" hint="This neighborhood may not exist." actionLabel="All neighborhoods" onAction={() => (window.location.href = "/neighborhoods")} icon={<MapPin className="h-6 w-6" />} />
      </div>
    );
  }

  return (
    <div>
      <div className="relative isolate overflow-hidden border-b border-line">
        <img src={area.image} alt={area.name} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-black/60" />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionLabel>Neighborhood</SectionLabel>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{area.name}</h1>
          <p className="mt-3 max-w-2xl text-white/80">{area.blurb}</p>
          <div className="mt-6 flex flex-wrap gap-6 text-white">
            <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> {formatCurrency(area.medianPrice)} median</span>
            <span className="flex items-center gap-2"><Compass className="h-4 w-4" /> {area.avgDaysOnMarket} days on market</span>
            <span className="flex items-center gap-2"><Footprints className="h-4 w-4" /> Walk score {area.walkScore}</span>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight text-strong">Active listings in {area.name}</h2>
        {results.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <EmptyState className="mt-6" title="No active listings" hint="Check back soon for new properties in this area." icon={<Home className="h-6 w-6" />} />
        )}
      </div>
    </div>
  );
}

// ── Agents ────────────────────────────────────────────────────────────────
export function AgentsPage() {
  return (
    <div>
      <PageHero label="Agents" title="Find your agent" subtitle="Experienced, vetted professionals backed by Civella's market intelligence." />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
          {agents.map((a) => (
            <Link key={a.id} to={`/agents/${a.id}`} className="flex flex-col rounded-xl border border-line bg-surface p-6 shadow-base transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
              <div className="flex items-center gap-4">
                <Avatar name={a.name} src={a.photoUrl || undefined} size={56} />
                <div>
                  <p className="text-base font-semibold text-strong">{a.name}</p>
                  <p className="text-sm text-muted">{a.title}</p>
                </div>
              </div>
              <div className="mt-4"><Stars rating={a.rating} /></div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {a.specialties.slice(0, 3).map((s) => (
                  <span key={s} className="rounded-full bg-subtle px-2.5 py-0.5 text-xs text-soft">{s}</span>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
                <div>
                  <p className="font-semibold text-strong tnum">{a.listingsCount}</p>
                  <p className="text-xs text-muted">Listings</p>
                </div>
                <div>
                  <p className="font-semibold text-strong tnum">{formatCurrency(a.salesVolume, true)}</p>
                  <p className="text-xs text-muted">Sales volume</p>
                </div>
              </div>
            </Link>
          ))}
        </Reveal>
      </div>
    </div>
  );
}

export function AgentProfilePage() {
  const { agentId } = useParams();
  const agent = agents.find((a) => a.id === agentId);
  const active = useMemo(() => listings.filter((l) => l.agentId === agentId), [agentId]);

  if (!agent) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState title="Agent not found" hint="This agent profile may have moved." actionLabel="All agents" onAction={() => (window.location.href = "/agents")} icon={<Compass className="h-6 w-6" />} />
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <Avatar name={agent.name} src={agent.photoUrl || undefined} size={96} />
          <div className="flex-1">
            <h1 className="text-3xl font-semibold tracking-tight text-strong">{agent.name}</h1>
            <p className="mt-1 text-muted">{agent.title} · {agent.brokerage}</p>
            <div className="mt-2"><Stars rating={agent.rating} /></div>
          </div>
          <div className="flex gap-2">
            <a href={`tel:${agent.phone}`}><Button variant="outline"><Phone className="h-4 w-4" /> Call</Button></a>
            <a href={`mailto:${agent.email}`}><Button><Mail className="h-4 w-4" /> Email</Button></a>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[[formatCurrency(agent.salesVolume, true), "Sales volume"], [String(agent.listingsCount), "Active listings"], [agent.rating.toFixed(1), "Average rating"]].map(([v, l]) => (
            <div key={l} className="rounded-xl border border-line bg-surface p-5 text-center">
              <p className="text-2xl font-semibold text-strong tnum">{v}</p>
              <p className="text-sm text-muted">{l}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-xl border border-line bg-surface p-6">
          <h2 className="text-lg font-semibold text-strong">About {agent.name.split(" ")[0]}</h2>
          <p className="mt-2 leading-relaxed text-soft">{agent.bio}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {agent.specialties.map((s) => (
              <span key={s} className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">{s}</span>
            ))}
          </div>
        </div>
        <h2 className="mt-10 text-2xl font-semibold tracking-tight text-strong">Active listings</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((l) => (
            <ListingCard key={l.id} listing={listingSummaries.find((s) => s.id === l.id)!} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Valuation ─────────────────────────────────────────────────────────────
export function ValuationPage() {
  const { toast } = useUI();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValuationEstimate | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (address.trim().length < 6) {
      toast("Enter a full street address.", "warning");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const est = await listingService.estimate(address.trim());
      setResult(est);
    } catch {
      toast("Couldn't generate an estimate. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const lowPct = result ? ((result.median - result.low) / (result.high - result.low)) * 100 : 50;

  return (
    <div>
      <PageHero label="Valuation" title="What's your home worth?" subtitle="An instant, data-backed estimate based on recent comparable sales and market trends." />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <form onSubmit={onSubmit} className="rounded-xl border border-line bg-surface p-6 shadow-base">
          <Input id="val-address" label="Property address" placeholder="e.g. 18 Cliffside Terrace, San Francisco, CA" value={address} onChange={(e) => setAddress(e.target.value)} leftIcon={<MapPin className="h-4 w-4" />} />
          <Button type="submit" size="lg" block className="mt-4" loading={loading}>Get my estimate</Button>
        </form>

        {result && (
          <div className="mt-6 rounded-xl border border-line bg-surface p-6 shadow-base">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Estimated value for</p>
                <p className="font-semibold text-strong">{result.address}</p>
              </div>
              <Badge tone="blue">Civella Estimate</Badge>
            </div>
            <p className="mt-6 text-center text-5xl font-semibold tracking-tight text-strong tnum">{formatCurrency(result.median)}</p>
            <p className="mt-1 text-center text-sm text-muted">Confidence range</p>

            <div className="relative mt-5 h-2.5 rounded-full bg-subtle">
              <div className="absolute inset-y-0 left-0 rounded-full bg-accent/40" style={{ width: "100%" }} />
              <div className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-4 border-accent bg-white shadow-base" style={{ left: `calc(${lowPct}% - 10px)` }} />
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-muted">Low <b className="text-strong tnum">{formatCurrency(result.low)}</b></span>
              <span className="text-muted">High <b className="text-strong tnum">{formatCurrency(result.high)}</b></span>
            </div>
            <p className="mt-5 rounded-lg bg-subtle p-3 text-xs text-muted">{result.basis}</p>
            <Link to="/listings"><Button variant="outline" block className="mt-4">Browse comparable listings</Button></Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Features ──────────────────────────────────────────────────────────────
export function FeaturesPage() {
  const groups = [
    { icon: MapPin, title: "Map-first discovery", desc: "Interactive map with live markers, region filters, and saved searches synced to the URL." },
    { icon: TrendingUp, title: "Market intelligence", desc: "Median prices, days-on-market and inventory deltas with animated counters." },
    { icon: Building2, title: "Rich listing detail", desc: "Galleries, spec grids, price-history charts, virtual tours and showing requests." },
    { icon: Compass, title: "Neighborhood guides", desc: "Curated area profiles with walk scores and filtered listings." },
    { icon: ShieldCheck, title: "Agent workspace", desc: "Dashboard, listings, lead inbox and showings in one protected portal." },
    { icon: Home, title: "Enterprise settings", desc: "8-section settings: account, notifications, security, privacy, integrations, billing." },
  ];
  return (
    <div>
      <PageHero label="Features" title="Everything agents and buyers need" subtitle="A complete PropTech frontend — discovery, intelligence, and a professional workspace." />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
          {groups.map((g) => (
            <div key={g.title} className="rounded-xl border border-line bg-surface p-6 shadow-base">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft text-accent"><g.icon className="h-5 w-5" /></span>
              <h3 className="mt-4 text-lg font-semibold text-strong">{g.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{g.desc}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </div>
  );
}

// ── About ─────────────────────────────────────────────────────────────────
export function AboutPage() {
  return (
    <div>
      <PageHero label="About Civella" title="Property, with clarity" subtitle="We build the tools that help agents lead their markets and buyers find the right home." />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-strong">Our mission</h2>
            <p className="mt-2 leading-relaxed text-soft">Bring transparency and intelligence to every property decision — from first search to closing — through a single, beautifully engineered platform.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-strong">Our vision</h2>
            <p className="mt-2 leading-relaxed text-soft">A world where market data, listings, and agent tools feel like one cohesive product — accessible, fast, and trustworthy.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-strong">By the numbers</h2>
            <div className="mt-3 grid grid-cols-3 gap-4 text-center">
              {[["12", "Live listings"], ["6", "Expert agents"], ["4", "Neighborhoods"]].map(([v, l]) => (
                <div key={l} className="rounded-xl border border-line bg-surface p-5">
                  <p className="text-2xl font-semibold text-strong tnum">{v}</p>
                  <p className="text-xs text-muted">{l}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">Demo dataset · RSP-FE-BP-2026.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Help ──────────────────────────────────────────────────────────────────
const FAQ = [
  ["How do I search for listings?", "Use the map-first listings page. Filter by type, price, beds and neighborhood — filters persist to the URL so you can share or bookmark a search."],
  ["Can I save a search?", "Yes. On the listings page, click “Save this search.” We'll alert you when new matching properties hit the market."],
  ["How do I contact an agent?", "Open any listing to message the agent or request a private showing. You can also browse the Agents page to find a specialist."],
  ["Is my payment information stored?", "No. The checkout is a UI demo only — no card is ever charged or stored. Real processing is handled by your backend team."],
  ["How does pricing work?", "Choose Starter, Professional or Enterprise. Switch between monthly and annual billing, then continue to checkout."],
  ["Can I change my plan later?", "Absolutely. Upgrade or downgrade anytime from Settings → Billing."],
];

export function HelpPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(0);
  const filtered = FAQ.filter(([t, a]) => `${t} ${a}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHero label="Help center" title="How can we help?" subtitle="Search common questions, or explore the platform." />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Input id="help-search" placeholder="Search the help center…" value={q} onChange={(e) => setQ(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
        <div className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {filtered.length === 0 && <p className="p-6 text-sm text-muted">No results for “{q}”.</p>}
          {filtered.map(([t, a], i) => (
            <div key={t}>
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                <span className="text-sm font-medium text-strong">{t}</span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open === i && "rotate-180")} />
              </button>
              {open === i && <p className="px-5 pb-4 text-sm leading-relaxed text-muted">{a}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 404 ───────────────────────────────────────────────────────────────────
export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <div className="relative h-48 w-full overflow-hidden rounded-xl border border-line bg-subtle grid-lines">
        {[[20, 30], [55, 45], [75, 25], [40, 65]].map(([x, y], i) => (
          <span key={i} className="absolute flex h-7 -translate-x-1/2 -translate-y-1/2 items-center rounded-full bg-accent px-2 text-[10px] font-semibold text-white shadow-base" style={{ left: `${x}%`, top: `${y}%` }}>
            {formatNumber(400 + i)}
          </span>
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-bold tracking-tight text-strong/10">404</span>
        </div>
      </div>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-strong">This address doesn't exist</h1>
      <p className="mt-2 text-muted">The page you're looking for has been sold, withdrawn, or never listed.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/"><Button>Back to home</Button></Link>
        <Link to="/listings"><Button variant="outline">Browse listings</Button></Link>
      </div>
    </div>
  );
}

// keep formatNumber referenced in 404 scope
void formatNumber;
