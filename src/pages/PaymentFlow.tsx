import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, CreditCard, Lock, ShieldCheck } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/hooks";
import { PLANS } from "@/data";
import { paymentSchema, type PaymentValues } from "@/lib/validation";
import { Button, Input } from "@/components/ui";
import { Logo } from "@/components/shared";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/store";
import type { BillingCycle, Plan } from "@/types";

function formatCardNumber(v: string): string {
  return v
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = (location.state ?? null) as { plan?: Plan; planId?: string; billingCycle?: BillingCycle } | null;
  const plan = state?.plan ?? PLANS.find((p) => p.id === (state?.planId ?? "")) ?? null;
  const billing: BillingCycle = state?.billingCycle ?? "monthly";

  // No selected plan (e.g. direct navigation) → never allow a free Pro grant.
  useEffect(() => {
    if (!plan) navigate("/pricing", { replace: true });
  }, [plan, navigate]);
  if (!plan) return null;

  const total = billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;

  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { cardName: "", cardNumber: "", expiry: "", cvv: "", billingAddress: "", city: "", state: "", zip: "" },
  });

  const onSubmit = (_data: PaymentValues) => {
    setSubmitting(true);
    // UI-only — no payment processing. Simulate gateway handshake.
    setTimeout(() => {
      navigate("/payment/success", {
        state: {
          orderId: `CVL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          plan,
          billingCycle: billing,
          totalCharged: total,
          confirmedAt: new Date().toISOString(),
          email: user?.email ?? "you@civella.com",
        },
      });
    }, 1100);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/pricing" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent">
        <ArrowLeft className="h-4 w-4" /> Back to pricing
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-strong">Checkout</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <Lock className="h-3.5 w-3.5" /> Secure payment · demo only — no card is charged.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Card details</p>
            <div className="mt-4 grid gap-4">
              <Input
                id="cardName"
                label="Name on card"
                placeholder="Jane Doe"
                error={errors.cardName?.message ?? null}
                {...register("cardName")}
              />
              <Input
                id="cardNumber"
                label="Card number"
                placeholder="4242 4242 4242 4242"
                leftIcon={<CreditCard className="h-4 w-4" />}
                inputMode="numeric"
                error={errors.cardNumber?.message ?? null}
                {...register("cardNumber")}
                onChange={(e) => setValue("cardNumber", formatCardNumber(e.target.value))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="expiry"
                  label="Expiry (MM/YY)"
                  placeholder="12/28"
                  inputMode="numeric"
                  error={errors.expiry?.message ?? null}
                  {...register("expiry")}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setValue("expiry", v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                  }}
                />
                <Input
                  id="cvv"
                  label="CVV"
                  placeholder="123"
                  inputMode="numeric"
                  error={errors.cvv?.message ?? null}
                  {...register("cvv")}
                  onChange={(e) => setValue("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Billing address</p>
            <div className="mt-4 grid gap-4">
              <Input
                id="billingAddress"
                label="Street address"
                placeholder="123 Market Street"
                error={errors.billingAddress?.message ?? null}
                {...register("billingAddress")}
              />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Input id="city" label="City" placeholder="San Francisco" error={errors.city?.message ?? null} {...register("city")} />
                <Input id="state" label="State" placeholder="CA" error={errors.state?.message ?? null} {...register("state")} />
                <Input id="zip" label="ZIP" placeholder="94103" inputMode="numeric" error={errors.zip?.message ?? null} {...register("zip")} />
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" block loading={submitting}>
            {submitting ? "Processing…" : `Pay ${formatCurrency(total)} & start subscription`}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5" /> This is a UI demo. No payment is processed or stored.
          </p>
          {/* keeps watch referenced for live form typing feel */}
          <span className="hidden">{watch("cardName")}</span>
        </form>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Order summary</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-strong">{plan.name} plan</p>
                <p className="text-sm text-muted">Billed {billing}</p>
              </div>
              <p className="text-lg font-semibold text-strong tnum">{formatCurrency(total)}</p>
            </div>
            <ul className="mt-5 space-y-2 border-t border-line pt-5 text-sm text-muted">
              {plan.features.slice(0, 4).map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> {f}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center justify-between border-t border-line pt-5">
              <span className="text-sm text-muted">Total due today</span>
              <span className="text-xl font-semibold text-strong tnum">{formatCurrency(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

type SuccessState = {
  orderId: string;
  plan: Plan;
  billingCycle: BillingCycle;
  totalCharged: number;
  confirmedAt: string;
  email: string;
};

export function PaymentSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const checkRef = useRef<SVGSVGElement>(null);
  const { setPlan } = useAuth();
  const data = (location.state ?? null) as SuccessState | null;

  // Only a real checkout can promote the plan — never grant Pro on direct nav.
  useEffect(() => {
    if (!data) {
      navigate("/pricing", { replace: true });
      return;
    }
    if (data.plan.id !== "starter") {
      setPlan(data.plan.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return null;
  const order = data;

  useEffect(() => {
    if (reduced) return;
    const svg = checkRef.current;
    if (!svg) return;
    const path = svg.querySelector("path");
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      if (path) {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        tl.to(path, { strokeDashoffset: 0, duration: 0.6, ease: "power3.out" });
      }
      tl.fromTo(".gsap-head", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.1");
      tl.fromTo(".gsap-card", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.2");
      tl.fromTo(".gsap-cta", { opacity: 0 }, { opacity: 1, duration: 0.4 }, "-=0.1");
    });
    return () => ctx.revert();
  }, [reduced]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center">
          <Logo showWord={false} size="lg" />
        </div>

        <div className="gsap-head mt-6" style={reduced ? undefined : { opacity: 0 }}>
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <svg ref={checkRef} width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5L10 17.5L19 7"
                stroke="var(--success)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-strong">Payment confirmed</h1>
          <p className="mt-2 text-muted">
            Welcome to Civella. A confirmation was sent to <span className="font-medium text-strong">{order.email}</span>.
          </p>
        </div>

        <div className="gsap-card mt-7 rounded-xl border border-line bg-surface p-6 text-left" style={reduced ? undefined : { opacity: 0 }}>
          <div className="flex items-center justify-between border-b border-line pb-4">
            <span className="text-sm text-muted">Order</span>
            <span className="font-mono text-sm font-semibold text-strong">{order.orderId}</span>
          </div>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Plan</dt><dd className="font-medium text-strong">{order.plan.name}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Billing</dt><dd className="font-medium text-strong capitalize">{order.billingCycle}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Amount charged</dt><dd className="font-semibold text-strong tnum">{formatCurrency(order.totalCharged)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Date</dt><dd className="font-medium text-strong">{new Date(order.confirmedAt).toLocaleDateString()}</dd></div>
          </dl>
        </div>

        <div className="gsap-cta mt-7 flex flex-col gap-3 sm:flex-row" style={reduced ? undefined : { opacity: 0 }}>
          <Button size="lg" block onClick={() => navigate("/agent/dashboard")}>
            Go to dashboard
          </Button>
          <Button size="lg" variant="outline" block onClick={() => navigate("/")}>
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}


