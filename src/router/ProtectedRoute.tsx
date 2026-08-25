import { type ReactNode, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, useUI } from "@/store";
import type { PlanId, UserRole } from "@/types";

const PLAN_RANK: Record<PlanId, number> = { starter: 0, pro: 1, enterprise: 2 };

/** PlanGuard — blocks free users from Pro-only routes. */
export function PlanGuard({ children, requiredPlan }: { children: ReactNode; requiredPlan: PlanId }) {
  const { user } = useAuth();
  const { toast } = useUI();
  const userRank = PLAN_RANK[user?.plan ?? "starter"];
  const requiredRank = PLAN_RANK[requiredPlan];

  useEffect(() => {
    if (userRank < requiredRank) {
      toast("Upgrade to Professional to access this feature.", "info");
    }
  }, [userRank, requiredRank, toast]);

  if (userRank < requiredRank) {
    return <Navigate to="/agent/dashboard" replace />;
  }
  return <>{children}</>;
}

/**
 * ProtectedRoute — pure state check (instant, testable).
 * Not authenticated → /auth/login?next=<path>
 * Wrong role → / with a toast.
 */
export function ProtectedRoute({ role }: { role?: UserRole } = {}) {
  const { user, status } = useAuth();
  const { toast } = useUI();
  const location = useLocation();

  const loading = status === "loading";

  useEffect(() => {
    if (!loading && user && role && user.role !== role) {
      toast("Access restricted to that area.", "warning");
    }
  }, [loading, user, role, toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">Checking your session…</div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/login?next=${next}`} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function ProtectedChild({ role, children }: { role?: UserRole; children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useUI();
  useEffect(() => {
    if (user && role && user.role !== role) toast("Access restricted to that area.", "warning");
  }, [user, role, toast]);
  if (user && role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}
