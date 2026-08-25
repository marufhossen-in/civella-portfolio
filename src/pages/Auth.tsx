import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Crown, Eye, EyeOff, KeyRound, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import heroImg from "@/assets/images/hero-property.jpg";
import { loginSchema, passwordStrength, signupSchema, type LoginValues, type SignupValues } from "@/lib/validation";
import { Button, Input, RadioCard } from "@/components/ui";
import { Logo } from "@/components/shared";
import { useAuth, useUI } from "@/store";
import type { PlanId } from "@/types";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.5 12.2c0-.7-.06-1.36-.18-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.7h3.56c2.08-1.92 3.24-4.74 3.24-7.8Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.7c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.17a6.6 6.6 0 0 1 0-4.22V7.11H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.46c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.1 14.96 1 12 1A11 11 0 0 0 2.18 7.11l3.66 2.84C6.71 7.39 9.14 5.46 12 5.46Z" />
    </svg>
  );
}

function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden lg:block">
        <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-accent/90 via-black/70 to-black/85" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/">
            <span className="inline-flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-white">
                <img src={heroImg} alt="" className="hidden" />
              </span>
            </span>
          </Link>
          <div>
            <Logo />
            <h2 className="mt-6 max-w-md text-3xl font-semibold leading-tight text-white">
              The premium property platform for agents who lead their market.
            </h2>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3 text-white/85">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                  <Building2 className="h-[18px] w-[18px]" />
                </span>
                <span className="text-sm">Map-first listings with live market analytics</span>
              </li>
              <li className="flex items-center gap-3 text-white/85">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                  <TrendingUp className="h-[18px] w-[18px]" />
                </span>
                <span className="text-sm">Pipeline, leads and showings in one workspace</span>
              </li>
              <li className="flex items-center gap-3 text-white/85">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                  <ShieldCheck className="h-[18px] w-[18px]" />
                </span>
                <span className="text-sm">Enterprise settings, roles and security</span>
              </li>
            </ul>
          </div>
          <p className="text-xs text-white/60">© {new Date().getFullYear()} Civella · RSP-FE-BP-2026</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-canvas px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-strong lg:mt-0">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, status, error } = useAuth();
  const { toast } = useUI();
  const next = new URLSearchParams(location.search).get("next") ?? "/agent/dashboard";
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    try {
      await login(values.email, values.password);
      navigate(next);
    } catch {
      /* error surfaced via store */
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your Civella workspace.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input id="email" type="email" label="Email" placeholder="you@civella.com" error={errors.email?.message ?? null} {...register("email")} />
        <Input
          id="password"
          type={showPw ? "text" : "password"}
          label="Password"
          placeholder="••••••••"
          error={errors.password?.message ?? null}
          rightSlot={
            <button type="button" onClick={() => setShowPw((s) => !s)} className="hover:text-strong" aria-label="Toggle password visibility">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          {...register("password")}
        />
        {error && <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}
        <Button type="submit" size="lg" block loading={status === "loading"}>
          Sign in
        </Button>
      </form>

      {/* Social / enterprise SSO (UI-ready for backend integration) */}
      <div className="relative my-5 text-center">
        <span className="relative z-10 bg-canvas px-3 text-xs text-muted">or continue with</span>
        <span className="absolute left-0 top-1/2 h-px w-full bg-line" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => toast("Google sign-in connects on the backend.", "info")} className="flex h-11 items-center justify-center gap-2 rounded-sm border border-line bg-surface text-sm font-medium text-strong transition hover:bg-subtle">
          <GoogleMark /> Google
        </button>
        <button type="button" onClick={() => toast("Enterprise SSO connects on the backend.", "info")} className="flex h-11 items-center justify-center gap-2 rounded-sm border border-line bg-surface text-sm font-medium text-strong transition hover:bg-subtle">
          <KeyRound className="h-4 w-4" /> Enterprise SSO
        </button>
      </div>
      <p className="mt-5 text-center text-sm text-muted">
        New to Civella?{" "}
        <Link to="/auth/signup" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <Sparkles className="h-3.5 w-3.5" /> Demo mode — any valid email & 8+ char password works.
      </p>
    </AuthShell>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, status, error } = useAuth();
  const { toast } = useUI();
  const qp = new URLSearchParams(location.search).get("plan");
  const initialPlan: PlanId = qp === "pro" || qp === "enterprise" || qp === "starter" ? qp : "starter";
  const [chosenPlan, setChosenPlan] = useState<PlanId>(initialPlan);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", passwordConfirm: "", role: "agent" },
  });
  const role = watch("role");
  const pw = watch("password");
  const strength = passwordStrength(pw ?? "");

  const onSubmit = async (values: SignupValues) => {
    try {
      // Account is always created FREE first. Pro/Enterprise is only granted
      // after checkout completes — never on signup alone.
      await signup({ name: values.name, email: values.email, role: values.role });
      if (chosenPlan === "starter") {
        navigate("/agent/dashboard");
      } else {
        navigate("/payment", { state: { planId: chosenPlan, billingCycle: "monthly" } });
      }
    } catch {
      /* surfaced via store */
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Start free, no credit card required.">
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => toast("Google sign-up connects on the backend.", "info")} className="flex h-11 items-center justify-center gap-2 rounded-sm border border-line bg-surface text-sm font-medium text-strong transition hover:bg-subtle">
          <GoogleMark /> Google
        </button>
        <button type="button" onClick={() => toast("Enterprise SSO connects on the backend.", "info")} className="flex h-11 items-center justify-center gap-2 rounded-sm border border-line bg-surface text-sm font-medium text-strong transition hover:bg-subtle">
          <KeyRound className="h-4 w-4" /> Enterprise SSO
        </button>
      </div>
      <div className="relative mb-4 text-center">
        <span className="relative z-10 bg-canvas px-3 text-xs text-muted">or sign up with email</span>
        <span className="absolute left-0 top-1/2 h-px w-full bg-line" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input id="name" label="Full name" placeholder="Jane Doe" error={errors.name?.message ?? null} {...register("name")} />
        <Input id="email" type="email" label="Email" placeholder="you@civella.com" error={errors.email?.message ?? null} {...register("email")} />
        <div>
          <Input
            id="password"
            type={showPw ? "text" : "password"}
            label="Password"
            placeholder="At least 8 characters"
            error={errors.password?.message ?? null}
            rightSlot={
              <button type="button" onClick={() => setShowPw((s) => !s)} className="hover:text-strong" aria-label="Toggle password visibility">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...register("password")}
          />
          {pw && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 flex-1 rounded-full transition-colors"
                    style={{ background: i < strength.score ? (strength.score <= 1 ? "var(--error)" : strength.score <= 2 ? "var(--warning)" : "var(--success)") : "var(--border)" }}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-muted">Password strength: <span className="font-medium text-strong">{strength.label}</span></p>
            </div>
          )}
        </div>
        <Input
          id="passwordConfirm"
          type={showConfirm ? "text" : "password"}
          label="Confirm password"
          placeholder="Re-enter your password"
          error={errors.passwordConfirm?.message ?? null}
          rightSlot={
            <button type="button" onClick={() => setShowConfirm((s) => !s)} className="hover:text-strong" aria-label="Toggle password visibility">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          {...register("passwordConfirm")}
        />

        <div>
          <p className="mb-1.5 text-[13px] font-medium text-soft">I'm signing up as</p>
          <div className="grid grid-cols-2 gap-2">
            <div onClick={() => setValue("role", "agent")}>
              <RadioCard active={role === "agent"} onClick={() => setValue("role", "agent")} title="Agent" description="Manage listings & leads" />
            </div>
            <div onClick={() => setValue("role", "admin")}>
              <RadioCard active={role === "admin"} onClick={() => setValue("role", "admin")} title="Admin / Broker" description="Oversee the brokerage" />
            </div>
          </div>
        </div>

        {/* Plan choice — enforced part of the signup flow */}
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-soft">Choose your plan</p>
          <div className="space-y-2">
            <RadioCard
              active={chosenPlan === "starter"}
              onClick={() => setChosenPlan("starter")}
              title="Free — $0/mo"
              description="10 listings · lead inbox · dashboard"
            />
            <RadioCard
              active={chosenPlan === "pro"}
              onClick={() => setChosenPlan("pro")}
              title="Professional — $79/mo"
              description="Unlimited listings, AI scoring & scheduler"
              icon={<Crown className="h-4 w-4" />}
            />
          </div>
          {chosenPlan !== "starter" && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-accent">
              <ShieldCheck className="h-3.5 w-3.5" /> You'll complete secure payment next, then Pro unlocks instantly.
            </p>
          )}
        </div>

        {error && <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}
        <Button type="submit" size="lg" block loading={status === "loading"}>
          {chosenPlan === "starter" ? "Create free account" : "Continue to payment"}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-success" /> Encrypted in transit · passwords are never stored in plain text.
        </p>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link to="/auth/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
