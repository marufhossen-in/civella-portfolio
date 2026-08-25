import { type ReactNode, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Compass, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/utils/cn";
import { useAuth, useUI } from "@/store";
import { Logo, ThemeToggle } from "@/components/shared";
import { Avatar, Tooltip } from "@/components/ui";

const NAV = [
  { label: "Listings", to: "/listings" },
  { label: "Neighborhoods", to: "/neighborhoods" },
  { label: "Valuation", to: "/valuation" },
  { label: "Agents", to: "/agents" },
  { label: "Pricing", to: "/pricing" },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

function PageTransition() {
  const { pathname } = useLocation();
  useEffect(() => {
    const el = document.querySelector(".page-enter") as HTMLElement | null;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.22, ease: "power2.out" });
    }, el);
    return () => ctx.revert();
  }, [pathname]);
  return null;
}

function Navbar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useUI();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Tooltip label="← Back">
          <Link to="/" className="rounded-md">
            <Logo />
          </Link>
        </Tooltip>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                  isActive ? "text-accent" : "text-soft hover:text-strong",
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ThemeToggle theme={theme} onChange={setTheme} />
          </div>

          {user ? (
            <div className="relative hidden lg:block">
              <button
                onClick={() => setMenu((m) => !m)}
                className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 transition-colors hover:border-line-strong"
              >
                <Avatar name={user.name} src={user.avatarUrl ?? undefined} size={30} />
                <span className="text-sm font-medium text-strong">{user.name.split(" ")[0]}</span>
              </button>
              {menu && (
                <div
                  role="menu"
                  className="dropdown-panel absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-line bg-surface shadow-elevated"
                  onMouseLeave={() => setMenu(false)}
                >
                  <Link
                    to="/agent/dashboard"
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-soft hover:bg-subtle"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Agent dashboard
                  </Link>
                  <Link
                    to="/agent/settings"
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-soft hover:bg-subtle"
                  >
                    <Compass className="h-4 w-4" /> Settings
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="flex w-full items-center gap-2.5 border-t border-line px-4 py-3 text-sm text-error hover:bg-subtle"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link
                to="/auth/login"
                className="rounded-md px-3.5 py-2 text-sm font-medium text-soft transition-colors hover:text-strong"
              >
                Sign in
              </Link>
              <Link
                to="/auth/signup"
                className="inline-flex h-10 items-center rounded-sm bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Get started
              </Link>
            </div>
          )}

          <button
            className="rounded-md p-2 text-soft lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div role="menu" className="dropdown-panel border-t border-line bg-surface lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-soft hover:bg-subtle"
              >
                {n.label}
              </NavLink>
            ))}
            <div className="mt-2 flex items-center justify-between rounded-md bg-subtle px-3 py-2.5">
              <span className="text-xs text-muted">Theme</span>
              <ThemeToggle theme={theme} onChange={setTheme} />
            </div>
            {user ? (
              <Link
                to="/agent/dashboard"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex h-11 items-center justify-center rounded-sm bg-accent px-4 text-sm font-medium text-white"
              >
                Go to dashboard
              </Link>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  to="/auth/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-sm border border-line bg-surface px-4 text-sm font-medium text-strong"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth/signup"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-sm bg-accent px-4 text-sm font-medium text-white"
                >
                  Get started
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const cols: { title: string; links: [string, string][] }[] = [
    { title: "Discover", links: [["Listings", "/listings"], ["Neighborhoods", "/neighborhoods"], ["Valuation", "/valuation"], ["Agents", "/agents"]] },
    { title: "Platform", links: [["Features", "/features"], ["Pricing", "/pricing"], ["Agent portal", "/agent/dashboard"], ["Help center", "/help"]] },
    { title: "Company", links: [["About", "/about"], ["Sign in", "/auth/login"], ["Create account", "/auth/signup"], ["Help", "/help"]] },
  ];
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted">
              Premium property discovery and agent intelligence. Map-first search, market analytics, and a professional workspace — in one place.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-strong">{c.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <Link to={href} className="text-sm text-muted transition-colors hover:text-accent">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Civella. Frontend demo · RSP-FE-BP-2026.</p>
          <p>Built with React 19 · Vite · Tailwind v4 · GSAP · Three.js</p>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <ScrollToTop />
      <PageTransition />
      <Navbar />
      <main className="flex-1 page-enter">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function BareLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <ScrollToTop />
      <PageTransition />
      <main className="page-enter">{children}</main>
    </div>
  );
}
