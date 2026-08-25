import type {
  Agent,
  Lead,
  LeadInput,
  Listing,
  ListingFilters,
  ListingSummary,
  MarketStat,
  Neighborhood,
  ShowingRequestInput,
  ValuationEstimate,
} from "@/types";

import {
  agents,
  leads as mockLeads,
  listingSummaries,
  listings,
  marketStats,
  neighborhoods,
} from "@/data";

const BASE = import.meta.env.VITE_API_URL as string | undefined;

function isInRange(value: number, min: number, max: number): boolean {
  if (min > 0 && value < min) return false;
  if (max > 0 && value > max) return false;
  return true;
}

export function applyFilters(rows: ListingSummary[], f: Partial<ListingFilters>): ListingSummary[] {
  const q = (f.query ?? "").trim().toLowerCase();
  let out = rows.filter((r) => {
    if (f.type && f.type !== "any" && r.type !== f.type) return false;
    if (f.minPrice !== undefined && f.minPrice > 0 && r.price < f.minPrice) return false;
    if (f.maxPrice !== undefined && f.maxPrice > 0 && r.price > f.maxPrice) return false;
    if (f.minBeds !== undefined && r.beds < f.minBeds) return false;
    if (f.maxBeds !== undefined && f.maxBeds > 0 && r.beds > f.maxBeds) return false;
    if (f.minSqft && r.sqft < f.minSqft) return false;
    if (f.areaId && r.areaId !== f.areaId) return false;
    if (q) {
      const hay = `${r.title} ${r.id}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  switch (f.sort) {
    case "price-asc":
      out = [...out].sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      out = [...out].sort((a, b) => b.price - a.price);
      break;
    case "sqft-desc":
      out = [...out].sort((a, b) => b.sqft - a.sqft);
      break;
    case "dom-asc":
      out = [...out].sort((a, b) => a.daysOnMarket - b.daysOnMarket);
      break;
    case "newest":
    default:
      out = [...out].sort((a, b) => b.daysOnMarket - a.daysOnMarket);
      break;
  }
  void isInRange;
  return out;
}

async function mockFetch<T>(path: string): Promise<T> {
  await new Promise((r) => setTimeout(r, 140));
  switch (path) {
    case "/listings":
      return { listings: listingSummaries } as unknown as T;
    case "/market-stats":
      return marketStats as unknown as T;
    case "/neighborhoods":
      return neighborhoods as unknown as T;
    case "/leads":
      return mockLeads as unknown as T;
    default:
      throw new Error(`No mock registered for ${path}`);
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE) return mockFetch<T>(path);
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

// ── Services ──────────────────────────────────────────────────────────────
export const listingService = {
  async list(filters: Partial<ListingFilters>): Promise<ListingSummary[]> {
    if (BASE) {
      const data = await request<{ listings: ListingSummary[] }>("/listings");
      return applyFilters(data.listings, filters);
    }
    return applyFilters(listingSummaries, filters);
  },
  async get(id: string): Promise<Listing | null> {
    if (BASE) return request<Listing>(`/listings/${id}`);
    await new Promise((r) => setTimeout(r, 120));
    return listings.find((l) => l.id === id) ?? null;
  },
  async submitLead(input: LeadInput): Promise<void> {
    if (BASE) {
      await request<void>("/leads", { method: "POST", body: JSON.stringify(input) });
      return;
    }
    await new Promise((r) => setTimeout(r, 500));
  },
  async submitShowing(input: ShowingRequestInput): Promise<void> {
    if (BASE) {
      await request<void>("/showings", { method: "POST", body: JSON.stringify(input) });
      return;
    }
    await new Promise((r) => setTimeout(r, 500));
  },
  async estimate(address: string): Promise<ValuationEstimate> {
    if (BASE) {
      return request<ValuationEstimate>("/valuation", {
        method: "POST",
        body: JSON.stringify({ address }),
      });
    }
    await new Promise((r) => setTimeout(r, 800));
    // Deterministic mock range derived from the address string.
    const seed = address.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const base = 900000 + (seed % 1800000);
    return {
      address,
      low: Math.round((base * 0.92) / 1000) * 1000,
      median: Math.round(base / 1000) * 1000,
      high: Math.round((base * 1.09) / 1000) * 1000,
      basis: "Recent comparable sales within 0.5 mi · 90-day market trend · livable area & lot size.",
      generatedAt: new Date().toISOString(),
    };
  },
};

export const agentService = {
  async list(): Promise<Agent[]> {
    if (BASE) return request<Agent[]>("/agents");
    await new Promise((r) => setTimeout(r, 120));
    return agents;
  },
  async get(id: string): Promise<Agent | null> {
    if (BASE) return request<Agent>(`/agents/${id}`);
    await new Promise((r) => setTimeout(r, 100));
    return agents.find((a) => a.id === id) ?? null;
  },
};

export const leadService = {
  async list(): Promise<Lead[]> {
    if (BASE) return request<Lead[]>("/leads");
    await new Promise((r) => setTimeout(r, 120));
    return mockLeads;
  },
};

export const referenceService = {
  async neighborhoods(): Promise<Neighborhood[]> {
    if (BASE) return request<Neighborhood[]>("/neighborhoods");
    await new Promise((r) => setTimeout(r, 100));
    return neighborhoods;
  },
  async marketStats(): Promise<MarketStat[]> {
    if (BASE) return request<MarketStat[]>("/market-stats");
    await new Promise((r) => setTimeout(r, 100));
    return marketStats;
  },
};
