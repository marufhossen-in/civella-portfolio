import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Building2,
  Home,
  Inbox,
  Menu,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuth, useUI } from "@/store";
import { Logo, ThemeToggle } from "@/components/shared";
import { Avatar, Tooltip } from "@/components/ui";

const NAV = [
  { label: "Dashboard", to: "/agent/dashboard", icon: Home },
  { label: "Listings", to: "/agent/listings", icon: Building2 },
  { label: "Leads", to: "/agent/leads", icon: Inbox },
  { label: "Profile", to: "/agent/profile", icon: Users },
  { label: "Settings", to: "/agent/settings", icon: Settings },
  { label: "Notifications", to: "/agent/notifications", icon: Bell },
];

function DashboardLogo() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // First click → dashboard overview · second click (already there) → public home.
  const onClick = () => (pathname === "/agent/dashboard" ? navigate("/") : navigate("/agent/dashboard"));
  return (
    <Tooltip label="⌂ Home">
      <button onClick={onClick} className="rounded-md">
        <Logo />
      </button>
    </Tooltip>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const items = user?.role === "admin" ? [...NAV, { label: "Admin", to: "/admin", icon: BarChart3 }] : NAV;
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "bg-accent-soft text-accent" : "text-soft hover:bg-subtle hover:text-strong",
            )
          }
        >
          <n.icon className="h-[18px] w-[18px]" />
          {n.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AgentLayout() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useUI();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-line px-5">
          <DashboardLogo />
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarContent />
        </div>
        <div className="border-t border-line p-3">
          <Link to="/" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted hover:bg-subtle hover:text-strong">
            <Sparkles className="h-[18px] w-[18px]" /> View public site
          </Link>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-line bg-surface">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <DashboardLogo />
              <button onClick={() => setMobileOpen(false)} className="text-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-canvas/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-md p-2 text-soft lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden text-sm text-muted sm:block">
              Agent workspace · <span className="text-soft">{user?.brokerage}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <ThemeToggle theme={theme} onChange={setTheme} />
            </div>
            <Link
              to="/agent/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-md text-soft hover:bg-subtle"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-error" />
            </Link>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3"
            >
              <Avatar name={user?.name ?? "Agent"} src={user?.avatarUrl ?? undefined} size={30} />
              <span className="hidden text-sm font-medium text-strong sm:block">
                {user?.name.split(" ")[0]}
              </span>
            </button>
          </div>
        </header>
        <main className="page-enter mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function agentGreeting() {
  return "Agent workspace";
}
