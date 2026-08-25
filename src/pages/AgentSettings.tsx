import { type ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  CreditCard,
  Crown,
  Globe,
  Link2,
  Palette,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Download,
  X,
  Zap,
} from "lucide-react";
import { Button, Input, Modal, RadioCard, Select, Toggle } from "@/components/ui";
import { SectionLabel } from "@/components/ui";
import { Logo } from "@/components/shared";
import { useLocalStorage, useMediaQuery } from "@/hooks";
import { useAuth, useUI } from "@/store";
import type { Theme } from "@/types";
import { cn } from "@/utils/cn";

type SectionId = "account" | "notifications" | "security" | "privacy" | "appearance" | "integrations" | "billing" | "danger";

const SECTIONS: { id: SectionId; label: string; icon: typeof Bell }[] = [
  { id: "account", label: "Account", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "privacy", label: "Privacy", icon: ShieldAlert },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "danger", label: "Danger Zone", icon: SlidersHorizontal },
];

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-2 border-b border-line py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-strong">{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      <div className="sm:w-64">{children}</div>
    </div>
  );
}

export default function AgentSettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme, toast } = useUI();
  const { user } = useAuth();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [section, setSection] = useState<SectionId>("account");
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const [notif, setNotif] = useLocalStorage("civella.notif", {
    emailNewLead: true,
    emailShowingRequest: true,
    emailLeadStatusChange: false,
    smsNewLead: false,
    smsShowingRequest: true,
    pushNotifications: true,
    weeklyReport: true,
    marketAlerts: true,
  });
  const [security, setSecurity] = useLocalStorage("civella.security", {
    twoFactorEnabled: false,
    sessionTimeout: "1h" as "15m" | "30m" | "1h" | "4h" | "8h",
    loginAlerts: true,
    deviceManagement: true,
  });
  const [privacy, setPrivacy] = useLocalStorage("civella.privacy", {
    profileVisibility: "public" as "public" | "agents-only" | "private",
    showEmail: true,
    showPhone: false,
    dataRetentionDays: 90,
  });
  const [appearance, setAppearance] = useLocalStorage("civella.appearance", {
    theme: theme,
    compactMode: false,
    fontSize: "md" as "sm" | "md" | "lg",
  });
  const [integrations, setIntegrations] = useLocalStorage("civella.integrations", {
    calendarSync: false,
    calendarProvider: "none" as "google" | "outlook" | "none",
    mlsConnected: false,
    mlsId: "",
    zapierWebhook: null as string | null,
  });
  const [account, setAccount] = useLocalStorage("civella.account", {
    language: "English",
    timezone: "America/Los_Angeles",
    dateFormat: "MM/DD/YYYY",
    currency: "USD",
  });

  const isPro = user?.plan === "pro" || user?.plan === "enterprise";

  const setAppearanceTheme = (t: Theme) => {
    setAppearance({ ...appearance, theme: t });
    setTheme(t);
  };

  const doExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      toast("Your data export is ready (demo).", "success");
    }, 1200);
  };

  const doDelete = () => {
    if (deleteText !== "DELETE") {
      toast('Type "DELETE" to confirm.', "warning");
      return;
    }
    toast("Account deletion scheduled (demo).", "error");
    setDeleteOpen(false);
    navigate("/");
  };

  const render = () => {
    switch (section) {
      case "account":
        return (
          <Panel title="Account" desc="Regional preferences for your workspace.">
            <Field label="Language">
              <Select id="lang" value={account.language} options={["English", "Spanish", "French", "Portuguese"].map((v) => ({ value: v, label: v }))} onChange={(e) => setAccount({ ...account, language: e.target.value })} />
            </Field>
            <Field label="Timezone" hint="Used for scheduling and reports.">
              <Select id="tz" value={account.timezone} options={["America/Los_Angeles", "America/New_York", "Europe/London", "Asia/Tokyo"].map((v) => ({ value: v, label: v }))} onChange={(e) => setAccount({ ...account, timezone: e.target.value })} />
            </Field>
            <Field label="Date format">
              <Select id="df" value={account.dateFormat} options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"].map((v) => ({ value: v, label: v }))} onChange={(e) => setAccount({ ...account, dateFormat: e.target.value })} />
            </Field>
            <Field label="Currency">
              <Select id="cur" value={account.currency} options={["USD", "EUR", "GBP", "CAD", "AUD"].map((v) => ({ value: v, label: v }))} onChange={(e) => setAccount({ ...account, currency: e.target.value })} />
            </Field>
            <SaveRow onSave={() => toast("Account settings saved.", "success")} />
          </Panel>
        );
      case "notifications":
        return (
          <Panel title="Notifications" desc="Choose how and when you're alerted.">
            <SubLabel>Email notifications</SubLabel>
            <ToggleRow label="New lead received" checked={notif.emailNewLead} onChange={(v) => setNotif({ ...notif, emailNewLead: v })} />
            <ToggleRow label="Showing request" checked={notif.emailShowingRequest} onChange={(v) => setNotif({ ...notif, emailShowingRequest: v })} />
            <ToggleRow label="Lead status change" checked={notif.emailLeadStatusChange} onChange={(v) => setNotif({ ...notif, emailLeadStatusChange: v })} />
            <ToggleRow label="Weekly summary report" checked={notif.weeklyReport} onChange={(v) => setNotif({ ...notif, weeklyReport: v })} />
            <SubLabel>SMS notifications</SubLabel>
            <ToggleRow label="New lead received" checked={notif.smsNewLead} onChange={(v) => setNotif({ ...notif, smsNewLead: v })} />
            <ToggleRow label="Showing request" checked={notif.smsShowingRequest} onChange={(v) => setNotif({ ...notif, smsShowingRequest: v })} />
            <SubLabel>Other</SubLabel>
            <ToggleRow label="Push notifications" checked={notif.pushNotifications} onChange={(v) => setNotif({ ...notif, pushNotifications: v })} />
            <ToggleRow label="Market alerts (price & new listings)" checked={notif.marketAlerts} onChange={(v) => setNotif({ ...notif, marketAlerts: v })} />
            <SaveRow onSave={() => toast("Notification preferences saved.", "success")} />
          </Panel>
        );
      case "security":
        return (
          <Panel title="Security" desc="Protect your account and sessions.">
            <Field label="Two-factor authentication" hint={security.twoFactorEnabled ? "Enabled" : "Add an extra layer of security."}>
              <Button variant={security.twoFactorEnabled ? "outline" : "primary"} size="sm" onClick={() => { setSecurity({ ...security, twoFactorEnabled: !security.twoFactorEnabled }); toast(security.twoFactorEnabled ? "2FA disabled." : "2FA enabled.", security.twoFactorEnabled ? "warning" : "success"); }}>
                {security.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
              </Button>
            </Field>
            <Field label="Session timeout">
              <Select id="timeout" value={security.sessionTimeout} options={( [["15m", "15 minutes"], ["30m", "30 minutes"], ["1h", "1 hour"], ["4h", "4 hours"], ["8h", "8 hours"]] as [string, string][]).map(([v, l]) => ({ value: v, label: l }))} onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value as typeof security.sessionTimeout })} />
            </Field>
            <ToggleRow label="Login alert emails" checked={security.loginAlerts} onChange={(v) => setSecurity({ ...security, loginAlerts: v })} />
            <ToggleRow label="Device management" checked={security.deviceManagement} onChange={(v) => setSecurity({ ...security, deviceManagement: v })} />
            <SubLabel>Active devices</SubLabel>
            <div className="overflow-hidden rounded-lg border border-line">
              {[
                ["MacBook Pro · Chrome", "San Francisco, CA", "Active now"],
                ["iPhone 15 · Safari", "San Francisco, CA", "2h ago"],
              ].map(([device, loc, at], i) => (
                <div key={i} className="flex items-center justify-between border-b border-line px-4 py-3 text-sm last:border-0">
                  <div>
                    <p className="font-medium text-strong">{device}</p>
                    <p className="text-xs text-muted">{loc} · {at}</p>
                  </div>
                  <Button variant="ghost" size="sm">Revoke</Button>
                </div>
              ))}
            </div>
            <SaveRow onSave={() => toast("Security settings saved.", "success")} />
          </Panel>
        );
      case "privacy":
        return (
          <Panel title="Privacy" desc="Control your visibility and data.">
            <SubLabel>Profile visibility</SubLabel>
            <div className="space-y-2">
              {(["public", "agents-only", "private"] as const).map((v) => (
                <RadioCard key={v} active={privacy.profileVisibility === v} onClick={() => setPrivacy({ ...privacy, profileVisibility: v })} title={v.replace("-", " ")} description={v === "public" ? "Visible to everyone" : v === "agents-only" ? "Visible to verified agents" : "Hidden from public search"} />
              ))}
            </div>
            <ToggleRow label="Show email on public profile" checked={privacy.showEmail} onChange={(v) => setPrivacy({ ...privacy, showEmail: v })} />
            <ToggleRow label="Show phone on public profile" checked={privacy.showPhone} onChange={(v) => setPrivacy({ ...privacy, showPhone: v })} />
            <Field label="Lead data retention" hint="How long to keep lead records.">
              <Select id="retention" value={String(privacy.dataRetentionDays)} options={[30, 60, 90, 180, 365].map((d) => ({ value: String(d), label: `${d} days` }))} onChange={(e) => setPrivacy({ ...privacy, dataRetentionDays: Number(e.target.value) })} />
            </Field>
            <Button variant="outline" size="sm" onClick={() => toast("Data download started (demo).", "info")}><Download className="h-4 w-4" /> Download my data</Button>
          </Panel>
        );
      case "appearance":
        return (
          <Panel title="Appearance" desc="Personalize how Civella looks for you.">
            <SubLabel>Theme</SubLabel>
            <div className="grid grid-cols-3 gap-3">
              {(["light", "system", "dark"] as const).map((t) => (
                <button key={t} onClick={() => setAppearanceTheme(t)} className={cn("rounded-lg border-2 p-3 text-sm font-medium capitalize transition-colors", appearance.theme === t ? "border-accent bg-accent-soft text-accent" : "border-line text-soft hover:bg-subtle")}>
                  {t}
                </button>
              ))}
            </div>
            <ToggleRow label="Compact mode" hint="Tighter dashboard spacing." checked={appearance.compactMode} onChange={(v) => setAppearance({ ...appearance, compactMode: v })} />
            <Field label="Font size">
              <div className="grid grid-cols-3 gap-2">
                {(["sm", "md", "lg"] as const).map((s) => (
                  <button key={s} onClick={() => setAppearance({ ...appearance, fontSize: s })} className={cn("rounded-md border py-2 text-sm capitalize transition-colors", appearance.fontSize === s ? "border-accent bg-accent-soft text-accent" : "border-line text-soft hover:bg-subtle")}>
                    {s === "sm" ? "Small" : s === "md" ? "Medium" : "Large"}
                  </button>
                ))}
              </div>
            </Field>
          </Panel>
        );
      case "integrations":
        return (
          <Panel title="Integrations" desc="Connect Civella to your tools.">
            <Field label="Calendar sync" hint={integrations.calendarSync ? `Connected · ${integrations.calendarProvider}` : "Sync showings to your calendar."}>
              <div className="flex gap-2">
                <Select id="cal" value={integrations.calendarProvider} options={( [["none", "None"], ["google", "Google"], ["outlook", "Outlook"]] as [string, string][]).map(([v, l]) => ({ value: v, label: l }))} onChange={(e) => setIntegrations({ ...integrations, calendarProvider: e.target.value as typeof integrations.calendarProvider })} />
                <Button size="sm" variant={integrations.calendarProvider !== "none" ? "outline" : "primary"} onClick={() => { setIntegrations({ ...integrations, calendarSync: integrations.calendarProvider !== "none" }); toast(integrations.calendarProvider !== "none" ? "Calendar connected." : "Select a provider.", integrations.calendarProvider !== "none" ? "success" : "warning"); }}>
                  {integrations.calendarSync ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </Field>
            <Field label="MLS connection" hint={isPro ? (integrations.mlsConnected ? "Verified" : "Enter your MLS ID.") : "Available on Professional"}>
              {isPro ? (
                <div className="flex gap-2">
                  <Input id="mls" value={integrations.mlsId} onChange={(e) => setIntegrations({ ...integrations, mlsId: e.target.value })} placeholder="MLS-XXXXX" />
                  <Button size="sm" onClick={() => { if (integrations.mlsId) { setIntegrations({ ...integrations, mlsConnected: true }); toast("MLS ID verified.", "success"); } else toast("Enter an MLS ID.", "warning"); }}>Verify</Button>
                </div>
              ) : (
                <Link to="/pricing"><Button size="sm" variant="outline" block><Crown className="h-3.5 w-3.5" /> Unlock with Pro</Button></Link>
              )}
            </Field>
            <Field label="Zapier webhook">
              <Input id="zap" value={integrations.zapierWebhook ?? ""} onChange={(e) => setIntegrations({ ...integrations, zapierWebhook: e.target.value || null })} placeholder="https://hooks.zapier.com/…" />
            </Field>
            <Button variant="outline" size="sm" onClick={() => toast("Webhook test sent (demo).", "info")}>Test webhook</Button>
          </Panel>
        );
      case "billing":
        return (
          <Panel title="Billing" desc="Manage your subscription and payment method.">
            <div className={cn("rounded-xl border p-5", isPro ? "border-accent/30 bg-accent-soft/30" : "border-line bg-surface")}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold capitalize text-strong">
                      {user?.plan === "starter" ? "Starter (Free)" : user?.plan === "pro" ? "Professional" : "Enterprise"} Plan
                    </h3>
                    {isPro && <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white"><Crown className="h-2.5 w-2.5" /> Active</span>}
                  </div>
                  {user?.planActivatedAt ? (
                    <p className="mt-1 text-xs text-muted">Active since {new Date(user.planActivatedAt).toLocaleDateString()}</p>
                  ) : (
                    <p className="mt-1 text-xs text-muted">Free forever — no credit card required</p>
                  )}
                </div>
                {!isPro && <Button size="sm" onClick={() => navigate("/pricing")}><Zap className="h-3.5 w-3.5" /> Upgrade</Button>}
              </div>
              {isPro && (
                <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-line pt-4 text-sm text-soft">
                  {(user?.plan === "enterprise"
                    ? ["Everything in Pro", "Unlimited seats", "MLS & API integrations", "Custom branding", "Advanced analytics", "Dedicated manager"]
                    : ["Unlimited listings", "AI lead scoring", "Interactive map", "Showing scheduler", "5 user seats", "Priority support"]
                  ).map((f) => (
                    <li key={f} className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> {f}</li>
                  ))}
                </ul>
              )}
            </div>

            {isPro && (
              <div className="mt-4 rounded-lg border border-line bg-surface p-5">
                <h3 className="text-sm font-semibold text-strong">Payment method</h3>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-12 items-center justify-center rounded border border-line bg-subtle text-xs font-semibold text-strong">VISA</span>
                    <span className="text-sm text-soft">•••• 4242</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate("/payment")}>Update</Button>
                </div>
                <p className="mt-3 text-xs text-muted">Next billing: {new Date(Date.now() + 30 * 86400000).toLocaleDateString()}</p>
              </div>
            )}

            <SubLabel>{isPro ? "Invoice history" : "Need more?"}</SubLabel>
            {isPro ? (
              <div className="overflow-hidden rounded-lg border border-line">
                {[["Aug 22, 2026", "$79.00", "Paid"], ["Jul 22, 2026", "$79.00", "Paid"], ["Jun 22, 2026", "$79.00", "Paid"]].map(([date, amt, status], i) => (
                  <div key={i} className="flex items-center justify-between border-b border-line px-4 py-3 text-sm last:border-0">
                    <span className="text-soft">{date}</span>
                    <span className="font-medium text-strong tnum">{amt}</span>
                    <span className="text-success">{status}</span>
                    <Button variant="ghost" size="sm">PDF</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-accent/30 bg-accent-soft/20 p-5">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-accent" />
                  <h3 className="font-semibold text-strong">Unlock Professional</h3>
                  <span className="ml-auto rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">Save 17% annual</span>
                </div>
                <p className="mt-1 text-sm text-muted">Everything you need to run a high-volume practice.</p>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-soft">
                  {["Unlimited listings", "AI lead scoring", "Showing scheduler", "Map & market analytics", "5 user seats", "Priority support"].map((f) => (
                    <div key={f} className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> {f}</div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => navigate("/pricing")}><Zap className="h-3.5 w-3.5" /> Upgrade now</Button>
                  <Button size="sm" variant="outline" onClick={() => navigate("/pricing")}>Compare plans</Button>
                </div>
              </div>
            )}
          </Panel>
        );
      case "danger":
        return (
          <Panel title="Danger Zone" desc="Irreversible account actions.">
            <div className="rounded-xl border border-error/30 bg-error/5 p-5">
              <h3 className="font-semibold text-strong">Export account data</h3>
              <p className="mt-1 text-sm text-muted">Download a copy of your listings, leads, and profile.</p>
              <Button variant="outline" size="sm" className="mt-3" loading={exporting} onClick={doExport}><Download className="h-4 w-4" /> Export data</Button>
            </div>
            <div className="mt-4 rounded-xl border border-error/40 bg-error/5 p-5">
              <h3 className="font-semibold text-error">Delete account</h3>
              <p className="mt-1 text-sm text-muted">Permanently delete your account and all associated data. This cannot be undone.</p>
              <Button variant="danger" size="sm" className="mt-3" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4" /> Delete my account</Button>
            </div>
          </Panel>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-8">
        <button onClick={() => navigate("/agent/dashboard")} title="⌂ Home" className="rounded-md">
          <Logo size="sm" />
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted sm:block">Workspace settings</span>
          <Button variant="outline" size="sm" onClick={() => navigate("/agent/dashboard")}>
            <X className="h-4 w-4" /> Close
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-8">
      <div className="mb-6">
        <SectionLabel>Settings</SectionLabel>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-strong">Workspace settings</h1>
        <p className="mt-1 text-sm text-muted">Signed in as {user?.email}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar tabs */}
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible no-scrollbar">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                section === s.id ? "bg-accent-soft text-accent" : "text-soft hover:bg-subtle hover:text-strong",
                s.id === "danger" && section !== s.id && "text-error/80",
              )}
            >
              <s.icon className="h-[18px] w-[18px]" /> {s.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="min-w-0">{isDesktop ? render() : <div className="rounded-xl border border-line bg-surface p-5">{render()}</div>}</div>
      </div>
      </main>

      <Modal open={deleteOpen} title="Delete account" onClose={() => setDeleteOpen(false)} maxWidth="max-w-md">
        <p className="text-sm text-muted">
          This permanently deletes your account and all associated data. This action cannot be undone.
        </p>
        <div className="mt-4">
          <Input id="confirm-delete" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder='Type DELETE to confirm' />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" disabled={deleteText !== "DELETE"} onClick={doDelete}>Delete forever</Button>
        </div>
      </Modal>
    </div>
  );
}

function Panel({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-6 py-4">
        <h2 className="font-semibold text-strong">{title}</h2>
        <p className="text-sm text-muted">{desc}</p>
      </div>
      <div className="px-6 py-2">{children}</div>
    </div>
  );
}

function SubLabel({ children }: { children: ReactNode }) {
  return <p className="mt-4 mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{children}</p>;
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-3.5 last:border-0">
      <div>
        <p className="text-sm font-medium text-strong">{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function SaveRow({ onSave }: { onSave: () => void }) {
  return (
    <div className="flex justify-end border-t border-line pt-4">
      <Button size="sm" onClick={onSave}>Save changes</Button>
    </div>
  );
}
