import {
  type Dispatch,
  type Reducer,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

// ── Persisted reducer with cross-tab sync ─────────────────────────────────
export function usePersistedReducer<S, A extends { type: string }>(
  reducer: Reducer<S, A>,
  key: string,
  initial: S,
): readonly [S, Dispatch<A>] {
  const [state, dispatch] = useReducer(reducer, initial, (init) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return init;
      const parsed = JSON.parse(raw) as S;
      // Preserve newly-added fields for object states; arrays are returned as-is.
      return Array.isArray(init) ? parsed : ({ ...(init as object), ...(parsed as object) } as S);
    } catch {
      return init;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* quota — non-fatal */
    }
  }, [key, state]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        dispatch({ type: "REPLACE_FROM_STORAGE", payload: e.newValue } as unknown as A);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  return [state, dispatch] as const;
}

// ── localStorage backed state (simpler for single values) ─────────────────
export function useLocalStorage<T>(key: string, initial: T): readonly [T, (v: T | ((p: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

// ── Debounce ──────────────────────────────────────────────────────────────
export function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Media query ───────────────────────────────────────────────────────────
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = () => setMatches(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

// ── Count up (animates a number over time) ────────────────────────────────
export function useCountUp(target: number, duration = 1400, start = true): number {
  const [value, setValue] = useState(0);
  const reduced = usePrefersReducedMotion();
  const frame = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (!start) return;
    if (reduced) {
      setValue(target);
      return;
    }
    const t0 = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (target - from) * eased);
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, duration, start, reduced]);

  return value;
}

// ── Click outside ─────────────────────────────────────────────────────────
export function useClickOutside<T extends HTMLElement>(
  onClose: () => void,
): React.RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return ref;
}

// ── Async data ────────────────────────────────────────────────────────────
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoFn = useMemo(() => fn, deps);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    memoFn()
      .then((d) => {
        if (active) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (active) {
          setError(e instanceof Error ? e.message : "Something went wrong");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [memoFn, nonce]);

  return { data, loading, error, reload };
}
