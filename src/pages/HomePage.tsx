import { type FormEvent, lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  ChevronRight,
  Compass,
  Cpu,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { agents, listingSummaries, marketStats, neighborhoods } from "@/data";
import { Button, Input, SectionLabel } from "@/components/ui";
import { ListingCard, StatTile, Stars } from "@/components/shared";
import { Reveal } from "@/components/Reveal";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/hooks";
import { Avatar } from "@/components/ui";
import heroImg from "@/assets/images/hero-property.jpg";
import cityImg from "@/assets/images/city-skyline.jpg";
import techImg from "@/assets/images/tech-visual.jpg";

const BuildingTour = lazy(() => import("@/components/BuildingTour").then((m) => ({ default: m.BuildingTour })));

const TYPE_OPTIONS = [
  { value: "any", label: "Any type" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "apartment", label: "Apartment" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("any");

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (type !== "any") params.set("type", type);
    navigate(`/listings?${params.toString()}`);
  };

  const featured = listingSummaries.slice(0, 6);

  const heroRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced || !heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(heroRef.current!.children, {
        opacity: 0,
        y: 24,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.05,
      });
    }, heroRef);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={heroImg} alt="Luxury residence at blue hour" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pb-28 sm:pt-32 lg:px-8">
          <div ref={heroRef} className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Map-first property intelligence
            </span>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
              Discover homes with the precision of an insider.
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base text-white/80 sm:text-lg">
              Civella unifies premium listings, live market analytics, and a professional agent workspace — so every move is informed.
            </p>

            {/* Search bar */}
            <form
              onSubmit={onSearch}
              className="mt-8 flex flex-col gap-2 rounded-xl border border-white/15 bg-white/10 p-2 backdrop-blur-md sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search className="h-5 w-5 text-white/60" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="City, neighborhood, or address"
                  className="h-10 w-full bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
                />
              </div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-10 rounded-md bg-white/10 px-3 text-sm text-white focus:outline-none sm:w-44"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="text-strong">
                    {o.label}
                  </option>
                ))}
              </select>
              <Button type="submit" size="lg" className="sm:w-auto">
                Search <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/70">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-white" /> Verified listings</span>
              <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-white" /> Live market data</span>
              <span className="flex items-center gap-1.5"><Compass className="h-4 w-4 text-white" /> Neighborhood guides</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARKET STATS ─────────────────────────────────────────────── */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
            {marketStats.map((s) => (
              <StatTile key={s.id} stat={s} />
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── FEATURED ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <SectionLabel>Featured residences</SectionLabel>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-strong sm:text-4xl">
              Hand-selected this week
            </h2>
          </div>
          <Link to="/listings" className="hidden items-center gap-1 text-sm font-medium text-accent hover:underline sm:flex">
            View all listings <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <Reveal className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
          {featured.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </Reveal>
        <div className="mt-8 sm:hidden">
          <Button variant="outline" block onClick={() => navigate("/listings")}>
            View all listings
          </Button>
        </div>
      </section>

      {/* ── NEIGHBORHOODS ────────────────────────────────────────────── */}
      <section className="border-y border-line bg-subtle">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <SectionLabel>Explore neighborhoods</SectionLabel>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-strong sm:text-4xl">
              Find the right address
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Curated area guides with median prices, walk scores, and days on market.
            </p>
          </div>
          <Reveal className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.07}>
            {neighborhoods.map((n) => (
              <Link
                key={n.id}
                to={`/neighborhoods/${n.id}`}
                className="group overflow-hidden rounded-xl border border-line bg-surface shadow-base transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
              >
                <div className="relative aspect-[3/2] overflow-hidden">
                  <img src={n.image} alt={n.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <h3 className="flex items-center gap-1.5 text-base font-semibold text-strong">
                    <MapPin className="h-4 w-4 text-accent" /> {n.name}
                  </h3>
                  <p className="mt-2 flex items-center justify-between text-xs text-muted">
                    <span>Walk score {n.walkScore}</span>
                    <span className="tnum font-medium text-strong">${(n.medianPrice / 1000).toFixed(0)}k median</span>
                  </p>
                </div>
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── TECH SECTION ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <SectionLabel>Platform technology</SectionLabel>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-strong sm:text-4xl">
              Built on a data backbone agents trust
            </h2>
            <p className="mt-4 text-muted">
              Every listing, lead, and valuation flows through one typed contract layer — mock-ready today, wired to your API tomorrow with a single environment switch.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                ["Typed service layer", "request<T>() swaps mock JSON for live endpoints with zero code changes."],
                ["Market intelligence", "Median price, days-on-market and inventory deltas update in real time."],
                ["Agent workspace", "Pipeline, leads, showings and enterprise settings in one workspace."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                    <Cpu className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-strong">{t}</span>
                    <span className="block text-sm text-muted">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex gap-3">
              <Link to="/features"><Button>Explore features</Button></Link>
              <Link to="/pricing"><Button variant="outline">See pricing</Button></Link>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="relative">
            <div className="overflow-hidden rounded-xl border border-line shadow-elevated">
              <img src={techImg} alt="Property technology visualization" className="aspect-[4/3] w-full object-cover" />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-line bg-surface p-4 shadow-elevated sm:block">
              <p className="text-xs text-muted">API swap point</p>
              <p className="mt-1 font-mono text-sm text-strong">VITE_API_URL → live</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── AGENTS ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <SectionLabel>Meet the agents</SectionLabel>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-strong sm:text-4xl">Find your agent</h2>
          </div>
          <Link to="/agents" className="hidden items-center gap-1 text-sm font-medium text-accent hover:underline sm:flex">
            All agents <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <Reveal className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
          {agents.slice(0, 3).map((a) => (
            <Link
              key={a.id}
              to={`/agents/${a.id}`}
              className="flex items-center gap-4 rounded-xl border border-line bg-surface p-5 shadow-base transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
            >
              <Avatar name={a.name} src={a.photoUrl || undefined} size={56} />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-strong">{a.name}</p>
                <p className="truncate text-sm text-muted">{a.title}</p>
                <div className="mt-1.5"><Stars rating={a.rating} /></div>
              </div>
            </Link>
          ))}
        </Reveal>
      </section>

      {/* ── 3D TOUR ──────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionLabel>Immersive tours</SectionLabel>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-strong sm:text-4xl">Walk through every angle in 3D</h2>
            <p className="mt-3 text-muted">
              Twelve guided viewpoints — from the motor court to the rooftop — render live in your browser. Auto-play or navigate manually; it adapts to light and dark.
            </p>
          </Reveal>
          <Reveal className="mt-10" delay={0.05}>
            <Suspense fallback={<div className="aspect-[16/10] animate-pulse rounded-xl bg-subtle" />}>
              <BuildingTour />
            </Suspense>
          </Reveal>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {(
              [
                [TrendingUp, "12 guided viewpoints", "Orbit the entire residence, inside and out."],
                [Compass, "Auto-play or manual", "Sit back or step through each stop yourself."],
                [ShieldCheck, "Adapts to your theme", "Crisp and realistic in both light and dark."],
              ] as [React.ComponentType<{ className?: string }>, string, string][]
            ).map(([Icon, t, d], i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-line bg-canvas p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-strong">{t}</span>
                  <span className="block text-xs text-muted">{d}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUATION + CITY BAND ────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-line">
        <div className="absolute inset-0">
          <img src={cityImg} alt="City skyline" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              What's your home worth?
            </h2>
            <p className="mt-4 max-w-md text-white/75">
              Get an instant, data-backed estimate. Our model blends recent comparable sales, market trends, and property specifics.
            </p>
            <Link to="/valuation" className="mt-6 inline-block">
              <Button size="lg">Estimate my home <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </Reveal>
          <Reveal delay={0.1} className="rounded-xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
            <p className="text-xs uppercase tracking-wide text-white/60">Quick valuation</p>
            <Input
              id="hv-address"
              className="mt-3 border-white/20 bg-white/10 text-white placeholder:text-white/50"
              placeholder="Enter your street address"
              leftIcon={<Building2 className="h-4 w-4 text-white/60" />}
            />
            <Link to="/valuation">
              <Button block className="mt-3">Get estimate</Button>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── NEWSLETTER CTA ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-base sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight text-strong sm:text-3xl">
            New listings, straight to your inbox
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Save your search and get matched the moment a property hits the market.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row"
          >
            <input
              type="email"
              required
              placeholder="you@email.com"
              className="h-11 flex-1 rounded-sm border border-line bg-canvas px-4 text-sm text-strong placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <Button type="submit">Subscribe</Button>
          </form>
        </div>
      </section>
    </div>
  );
}
