import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import type {
  Lead,
  LeadStatus,
  ListingFilters,
  PlanId,
  SavedSearch,
  SessionUser,
  Theme,
  ToastMessage,
} from "@/types";
import { leads as seedLeads } from "@/data";
import { usePersistedReducer } from "@/hooks";

const SESSION_KEY = "civella.session";
const LEADS_KEY = "civella.leads";
const SAVED_KEY = "civella.savedSearches";
const THEME_KEY = "civella.theme";

function resolveTheme(t: Theme): "light" | "dark" {
  if (t === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return t;
}

// ════════════════════════════ UI STORE ═══════════════════════════════════
type UIState = { theme: Theme; toasts: ToastMessage[] };
type UIAction =
  | { type: "SET_THEME"; theme: Theme }
  | { type: "ADD_TOAST"; toast: ToastMessage }
  | { type: "REMOVE_TOAST"; id: string }
  | { type: "CLEAR_TOASTS" };

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case "SET_THEME":
      return { ...state, theme: action.theme };
    case "ADD_TOAST":
      return { ...state, toasts: [...state.toasts, action.toast] };
    case "REMOVE_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case "CLEAR_TOASTS":
      return { ...state, toasts: [] };
    default:
      return state;
  }
}

interface UIContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toast: (message: string, tone?: ToastMessage["tone"]) => void;
  dismissToast: (id: string) => void;
  toasts: ToastMessage[];
}

const UIContext = createContext<UIContextValue | null>(null);

function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(uiReducer, THEME_KEY, {
    theme: "system",
    toasts: [],
  } satisfies UIState);

  useEffect(() => {
    document.documentElement.dataset.theme = resolveTheme(state.theme);
  }, [state.theme]);

  // Transient toasts should never persist across reloads — clear any on mount.
  useEffect(() => {
    dispatch({ type: "CLEAR_TOASTS" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to OS theme changes when in system mode.
  useEffect(() => {
    if (state.theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      document.documentElement.dataset.theme = resolveTheme("system");
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [state.theme]);

  const toast = useCallback((message: string, tone: ToastMessage["tone"] = "success") => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    dispatch({ type: "ADD_TOAST", toast: { id, message, tone } });
    setTimeout(() => dispatch({ type: "REMOVE_TOAST", id }), 4200);
  }, []);

  const setTheme = useCallback((theme: Theme) => dispatch({ type: "SET_THEME", theme }), []);
  const dismissToast = useCallback((id: string) => dispatch({ type: "REMOVE_TOAST", id }), []);

  const value = useMemo<UIContextValue>(
    () => ({ theme: state.theme, setTheme, toast, dismissToast, toasts: state.toasts }),
    [state.theme, state.toasts, setTheme, toast, dismissToast],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within AppProviders");
  return ctx;
}

// ════════════════════════════ AUTH STORE ═════════════════════════════════
type AuthState = {
  user: SessionUser | null;
  status: "idle" | "loading" | "authenticated" | "error";
  error: string | null;
};
type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; user: SessionUser }
  | { type: "LOGIN_ERROR"; error: string }
  | { type: "LOGOUT" }
  | { type: "UPDATE_USER"; user: Partial<SessionUser> }
  | { type: "SET_PLAN"; plan: PlanId; activatedAt: string }
  | { type: "HYDRATE"; user: SessionUser };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, status: "loading", error: null };
    case "LOGIN_SUCCESS":
      return { user: action.user, status: "authenticated", error: null };
    case "LOGIN_ERROR":
      return { ...state, status: "error", error: action.error };
    case "UPDATE_USER":
      return { ...state, user: state.user ? { ...state.user, ...action.user } : state.user };
    case "SET_PLAN":
      return state.user
        ? { ...state, user: { ...state.user, plan: action.plan, planActivatedAt: action.activatedAt } }
        : state;
    case "HYDRATE":
      return { user: action.user, status: "authenticated", error: null };
    case "LOGOUT":
      return { user: null, status: "idle", error: null };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<SessionUser>;
  signup: (input: { name: string; email: string; role: "agent" | "admin" }) => Promise<SessionUser>;
  logout: () => void;
  updateUser: (user: Partial<SessionUser>) => void;
  setPlan: (plan: PlanId) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(authReducer, SESSION_KEY, {
    user: null,
    status: "idle",
    error: null,
  } satisfies AuthState);

  useEffect(() => {
    if (state.user && state.status !== "authenticated") {
      dispatch({ type: "HYDRATE", user: state.user });
    }
  }, [state.user, state.status]);

  const login = useCallback(async (email: string, _password: string): Promise<SessionUser> => {
    dispatch({ type: "LOGIN_START" });
    await new Promise((r) => setTimeout(r, 650));
    // Demo login signs into a FREE workspace — Pro is only granted after
    // completing checkout, so the plan-gated flow can never be bypassed.
    const user: SessionUser = {
      id: "ag-1",
      name: "Eleanor Whitfield",
      email,
      role: "agent",
      brokerage: "Civella Premier",
      avatarUrl: null,
      plan: "starter",
      planActivatedAt: null,
    };
    dispatch({ type: "LOGIN_SUCCESS", user });
    return user;
  }, []);

  const signup = useCallback(
    async (input: { name: string; email: string; role: "agent" | "admin" }): Promise<SessionUser> => {
      dispatch({ type: "LOGIN_START" });
      await new Promise((r) => setTimeout(r, 800));
      const user: SessionUser = {
        id: "ag-new",
        name: input.name,
        email: input.email,
        role: input.role,
        brokerage: "Civella Premier",
        avatarUrl: null,
        plan: "starter",
        planActivatedAt: null,
      };
      dispatch({ type: "LOGIN_SUCCESS", user });
      return user;
    },
    [],
  );

  const logout = useCallback(() => dispatch({ type: "LOGOUT" }), []);
  const updateUser = useCallback((user: Partial<SessionUser>) => dispatch({ type: "UPDATE_USER", user }), []);
  const setPlan = useCallback(
    (plan: PlanId) => dispatch({ type: "SET_PLAN", plan, activatedAt: new Date().toISOString() }),
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, signup, logout, updateUser, setPlan }),
    [state, login, signup, logout, updateUser, setPlan],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AppProviders");
  return ctx;
}

// ════════════════════════════ LEAD STORE ═════════════════════════════════
type LeadAction =
  | { type: "ADD"; lead: Lead }
  | { type: "SET_STATUS"; id: string; status: LeadStatus }
  | { type: "ASSIGN"; id: string; agentId: string }
  | { type: "RESET" };

function leadReducer(state: Lead[], action: LeadAction): Lead[] {
  switch (action.type) {
    case "ADD":
      return [action.lead, ...state];
    case "SET_STATUS":
      return state.map((l) => (l.id === action.id ? { ...l, status: action.status } : l));
    case "ASSIGN":
      return state.map((l) => (l.id === action.id ? { ...l, assignedAgentId: action.agentId } : l));
    case "RESET":
      return seedLeads;
    default:
      return state;
  }
}

interface LeadContextValue {
  leads: Lead[];
  addLead: (lead: Lead) => void;
  setStatus: (id: string, status: LeadStatus) => void;
  assign: (id: string, agentId: string) => void;
}

const LeadContext = createContext<LeadContextValue | null>(null);

function LeadProvider({ children }: { children: ReactNode }) {
  const [leads, dispatch] = usePersistedReducer(leadReducer, LEADS_KEY, seedLeads);
  const value = useMemo<LeadContextValue>(
    () => ({
      leads,
      addLead: (lead) => dispatch({ type: "ADD", lead }),
      setStatus: (id, status) => dispatch({ type: "SET_STATUS", id, status }),
      assign: (id, agentId) => dispatch({ type: "ASSIGN", id, agentId }),
    }),
    [leads],
  );
  return <LeadContext.Provider value={value}>{children}</LeadContext.Provider>;
}

export function useLeads(): LeadContextValue {
  const ctx = useContext(LeadContext);
  if (!ctx) throw new Error("useLeads must be used within AppProviders");
  return ctx;
}

// ════════════════════════════ SAVED SEARCH STORE ═════════════════════════
type SavedAction =
  | { type: "ADD"; search: SavedSearch }
  | { type: "REMOVE"; id: string }
  | { type: "CLEAR" };

function savedReducer(state: SavedSearch[], action: SavedAction): SavedSearch[] {
  switch (action.type) {
    case "ADD":
      return [action.search, ...state];
    case "REMOVE":
      return state.filter((s) => s.id !== action.id);
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

interface SavedContextValue {
  saved: SavedSearch[];
  save: (label: string, filters: ListingFilters) => void;
  remove: (id: string) => void;
}

const SavedContext = createContext<SavedContextValue | null>(null);

function SavedProvider({ children }: { children: ReactNode }) {
  const [saved, dispatch] = usePersistedReducer(savedReducer, SAVED_KEY, [] as SavedSearch[]);
  const value = useMemo<SavedContextValue>(
    () => ({
      saved,
      save: (label, filters) =>
        dispatch({
          type: "ADD",
          search: {
            id: `ss-${Date.now()}`,
            label,
            filters,
            createdAt: new Date().toISOString(),
            lastNotifiedAt: null,
          },
        }),
      remove: (id) => dispatch({ type: "REMOVE", id }),
    }),
    [saved],
  );
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSavedSearches(): SavedContextValue {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSavedSearches must be used within AppProviders");
  return ctx;
}

// ════════════════════════════ ROOT ═══════════════════════════════════════
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <UIProvider>
      <AuthProvider>
        <LeadProvider>
          <SavedProvider>{children}</SavedProvider>
        </LeadProvider>
      </AuthProvider>
    </UIProvider>
  );
}
