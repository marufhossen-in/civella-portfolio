// ════════════════════════════════════════════════════════════════════
// CIVELLA · Domain Types (RSP-FE-BP-2026) — zero `any`
// ════════════════════════════════════════════════════════════════════

export type ListingStatus = "active" | "pending" | "sold" | "withdrawn";
export type ListingType = "house" | "apartment" | "condo" | "townhouse" | "land" | "commercial";
export type SortKey = "newest" | "price-asc" | "price-desc" | "sqft-desc" | "dom-asc";

export interface Coordinates {
  lat: number;
  lng: number;
}
export interface ListingImage {
  id: string;
  url: string;
  alt: string;
  isCover: boolean;
}
export interface PricePoint {
  at: string;
  price: number;
}

export interface Listing {
  id: string;
  title: string;
  type: ListingType;
  status: ListingStatus;
  price: number;
  currency: "USD";
  address: { street: string; city: string; state: string; zip: string; areaId: string };
  coords: Coordinates;
  beds: number;
  baths: number;
  sqft: number;
  lotSqft: number | null;
  yearBuilt: number | null;
  garage: number | null;
  description: string;
  features: string[];
  images: ListingImage[];
  virtualTourUrl: string | null;
  agentId: string;
  publishedAt: string;
  priceHistory: PricePoint[];
  daysOnMarket: number;
}

export interface ListingSummary {
  id: string;
  title: string;
  price: number;
  currency: "USD";
  beds: number;
  baths: number;
  sqft: number;
  coverImage: string;
  type: ListingType;
  areaId: string;
  status: ListingStatus;
  daysOnMarket: number;
  coords: Coordinates;
}

export interface ListingFilters {
  query: string;
  type: ListingType | "any";
  minPrice: number;
  maxPrice: number;
  minBeds: number;
  maxBeds: number;
  minSqft: number | null;
  areaId: string | null;
  radiusMiles: number | null;
  sort: SortKey;
}

export interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

// ── People & leads ──────────────────────────────────────────────────────
export interface Agent {
  id: string;
  name: string;
  photoUrl: string;
  title: string;
  brokerage: string;
  phone: string;
  email: string;
  nmlsId: string | null;
  listingsCount: number;
  salesVolume: number;
  bio: string;
  specialties: string[];
  rating: number;
}
export interface AgentSummary {
  id: string;
  name: string;
  photoUrl: string;
  brokerage: string;
  listingsCount: number;
}

export type LeadStatus = "new" | "contacted" | "showing-booked" | "closed";
export type LeadSource = "detail-page" | "valuation" | "newsletter" | "showing";
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string | null;
  message: string;
  source: LeadSource;
  status: LeadStatus;
  assignedAgentId: string | null;
  createdAt: string;
}
export interface LeadInput {
  name: string;
  email: string;
  phone: string;
  propertyId: string | null;
  message: string;
  source: LeadSource;
}
export type LeadTab = "all" | LeadStatus;

export type ShowingSlot = "morning" | "afternoon";
export interface ShowingRequestInput {
  listingId: string;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  timeSlot: ShowingSlot;
  notes: string;
}

export interface SavedSearch {
  id: string;
  label: string;
  filters: ListingFilters;
  createdAt: string;
  lastNotifiedAt: string | null;
}

export interface MarketStat {
  id: "medianPrice" | "avgDaysOnMarket" | "activeListings" | "soldThisMonth";
  label: string;
  value: number;
  format: "currency" | "integer" | "days";
  deltaPct: number;
}

export interface Neighborhood {
  id: string;
  name: string;
  blurb: string;
  medianPrice: number;
  avgDaysOnMarket: number;
  walkScore: number;
  coords: Coordinates;
  image: string;
  listingsCount: number;
}

export interface ValuationEstimate {
  address: string;
  low: number;
  median: number;
  high: number;
  basis: string;
  generatedAt: string;
}

export interface AgentTotals {
  activeListings: number;
  leadsNew: number;
  leadsContacted: number;
  showingsThisWeek: number;
  avgDaysOnMarket: number;
}

export type UserRole = "agent" | "admin";
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  brokerage: string;
  avatarUrl: string | null;
  plan: PlanId; // 'starter' | 'pro' | 'enterprise'
  planActivatedAt: string | null; // ISO string; null = Starter (free)
}
export interface Option {
  value: string;
  label: string;
}

// ── Pricing & Payment ───────────────────────────────────────────────────
export type PlanId = "starter" | "pro" | "enterprise";
export type BillingCycle = "monthly" | "annual";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  highlighted: boolean;
  cta: string;
}

export interface PricingState {
  hoveredPlan: PlanId | null;
  selectedPlan: PlanId | null;
  billingCycle: BillingCycle;
}

export interface PaymentFormState {
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  billingAddress: string;
  city: string;
  state: string;
  zip: string;
}

// ── Profile & Settings ──────────────────────────────────────────────────
export interface ProfileForm {
  displayName: string;
  email: string;
  phone: string;
  title: string;
  brokerage: string;
  bio: string;
  licenseNumber: string;
  nmlsId: string;
  avatarUrl: string | null;
}

export interface AccountSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
}
export interface NotificationSettings {
  emailNewLead: boolean;
  emailShowingRequest: boolean;
  emailLeadStatusChange: boolean;
  smsNewLead: boolean;
  smsShowingRequest: boolean;
  pushNotifications: boolean;
  weeklyReport: boolean;
  marketAlerts: boolean;
}
export type SessionTimeout = "15m" | "30m" | "1h" | "4h" | "8h";
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: SessionTimeout;
  loginAlerts: boolean;
  deviceManagement: boolean;
}
export interface PrivacySettings {
  profileVisibility: "public" | "agents-only" | "private";
  showEmail: boolean;
  showPhone: boolean;
  dataRetentionDays: number;
}
export interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  compactMode: boolean;
  fontSize: "sm" | "md" | "lg";
}
export interface IntegrationSettings {
  calendarSync: boolean;
  calendarProvider: "google" | "outlook" | "none";
  mlsConnected: boolean;
  mlsId: string;
  zapierWebhook: string | null;
}
export interface BillingSettings {
  plan: PlanId;
  billingCycle: BillingCycle;
  nextBillingDate: string;
  paymentMethodLast4: string | null;
}

export interface ToastMessage {
  id: string;
  tone: "success" | "error" | "info" | "warning";
  message: string;
}

export type Theme = "light" | "dark" | "system";
