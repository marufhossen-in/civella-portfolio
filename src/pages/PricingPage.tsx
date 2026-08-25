import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Minus, Sparkles } from "lucide-react";
import { PLANS } from "@/data";
import { Button, SectionLabel } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/store";
import type { BillingCycle, Plan, PlanId } from "@/types";

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [hovered, setHovered] = useState<PlanId | null>(null);
  const [selected, setSelected] = useState<PlanId | null>(null);

  const activePlan: Plan | null = PLANS.find((p) => p.id === selected) ?? null;

  const continueToPayment = () => {
    if (!activePlan) return;
    // Free plan — Starter is $0; it never reaches checkout.
    if (activePlan.monthlyPrice === 0) {
      if (user) {
        navigate("/agent/dashboard");
      } else {
        navigate(`/auth/signup?plan=${activePlan.id}`);
      }
      return;
    }
    // Paid plan — Pro/Enterprise require completing payment BEFORE Pro access.
    sessionStorage.setItem(
      "civella.pendingPlan",
      JSON.stringify({ planId: activePlan.id, billingCycle: billing }),
    );
    if (user) {
      navigate("/payment", { state: { plan: activePlan, billingCycle: billing } });
    } else {
      navigate(`/auth/signup?plan=${activePlan.id}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <SectionLabel>Pricing</SectionLabel>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-strong sm:text-5xl">
          Plans that scale with you
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Choose the plan that fits your business. Switch or cancel anytime — no lock-in.
        </p>

        {/* Billing toggle */}
        <div className="mt-7 inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              billing === "monthly" ? "bg-accent text-white" : "text-soft hover:text-strong",
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              billing === "annual" ? "bg-accent text-white" : "text-soft hover:text-strong",
            )}
          >
            Annual
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", billing === "annual" ? "bg-white/20" : "bg-success/10 text-success")}>
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Plan grid */}
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isHovered = hovered === plan.id;
          const isSelected = selected === plan.id;
          const highlighted = isHovered || isSelected;
          const price = billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;

          return (
            <div
              key={plan.id}
              onMouseEnter={() => setHovered(plan.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(plan.id)}
              className={cn(
                "relative flex cursor-pointer flex-col rounded-2xl border bg-surface p-7 transition-all duration-300",
                highlighted
                  ? "border-accent shadow-elevated ring-1 ring-accent lg:-translate-y-2"
                  : "border-line shadow-base hover:-translate-y-1",
                plan.highlighted && "lg:scale-[1.02]",
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                  Most popular
                </span>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-strong">{plan.name}</h3>
                {isSelected && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">{plan.tagline}</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-strong tnum">{formatCurrency(price)}</span>
                <span className="text-sm text-muted">/{billing === "monthly" ? "mo" : "yr"}</span>
              </div>
              {billing === "annual" && (
                <p className="mt-1 text-xs text-success">Billed annually · save {formatCurrency(plan.monthlyPrice * 12 - plan.annualPrice)}</p>
              )}

              {/* Feature detail popup (driven by hover) */}
              <div
                className={cn(
                  "mt-4 overflow-hidden rounded-lg border border-accent/30 bg-accent-soft/60 px-4 transition-all duration-300",
                  isHovered ? "max-h-60 py-3 opacity-100" : "max-h-0 border-transparent py-0 opacity-0",
                )}
              >
                <p className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                  <Sparkles className="h-3.5 w-3.5" /> What's included
                </p>
                <ul className="mt-2 space-y-1.5">
                  {plan.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-soft">
                      <Check className="h-3.5 w-3.5 text-success" /> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <ul className="mt-5 space-y-3 border-t border-line pt-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-soft">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-success">
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-2">
                <div
                  className={cn(
                    "flex h-11 items-center justify-center gap-1.5 rounded-sm text-sm font-medium transition-colors",
                    isSelected ? "bg-accent text-white" : "bg-subtle text-strong",
                  )}
                >
                  {isSelected ? (
                    <>Selected <Check className="h-4 w-4" /></>
                  ) : (
                    <span className="flex items-center gap-1 text-muted"><Minus className="h-3.5 w-3.5" /> Click to select</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA bar */}
      <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-xl border border-line bg-subtle p-5 sm:flex-row">
        <div>
          <p className="text-sm font-semibold text-strong">
            {activePlan ? `Continue with ${activePlan.name}` : "Select a plan to continue"}
          </p>
          <p className="text-sm text-muted">
            {activePlan
              ? `${formatCurrency(billing === "monthly" ? activePlan.monthlyPrice : activePlan.annualPrice)} billed ${billing === "monthly" ? "monthly" : "annually"} · cancel anytime.`
              : "Hover a plan to preview features, click to choose it."}
          </p>
        </div>
        <Button size="lg" disabled={!activePlan} onClick={continueToPayment}>
          {activePlan && activePlan.monthlyPrice === 0 ? "Continue for free" : "Continue to checkout"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Comparison table */}
      <div className="mt-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-strong">Compare features</h2>
        <div className="mt-6 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line bg-subtle text-left">
                <th className="px-4 py-3 font-medium text-muted">Feature</th>
                {PLANS.map((p) => (
                  <th key={p.id} className="px-4 py-3 font-semibold text-strong">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Active listings", ["25", "Unlimited", "Unlimited"]],
                ["Lead inbox", ["50/mo", "Unlimited", "Unlimited"]],
                ["Market analytics", [false, true, true]],
                ["Saved searches & alerts", [false, true, true]],
                ["Custom branding", [false, true, true]],
                ["Multi-agent roster", [false, false, true]],
                ["SSO & advanced security", [false, false, true]],
                ["Dedicated success manager", [false, false, true]],
              ].map((row, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-soft">{row[0]}</td>
                  {row.slice(1).map((v, j) => (
                    <td key={j} className="px-4 py-3 text-strong">
                      {typeof v === "boolean" ? (
                        v ? <Check className="h-4 w-4 text-success" /> : <Minus className="h-4 w-4 text-line-strong" />
                      ) : (
                        v as string
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
