import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Crown, Lock, X, Zap } from "lucide-react";
import { profileSchema, type ProfileValues } from "@/lib/validation";
import { Button, Input, Textarea } from "@/components/ui";
import { Avatar } from "@/components/ui";
import { Logo } from "@/components/shared";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { useAuth, useUI } from "@/store";
import { cn } from "@/utils/cn";

export default function AgentProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { toast } = useUI();
  const isPro = user?.plan === "pro" || user?.plan === "enterprise";
  const [avatar, setAvatar] = useState<string | null>(user?.avatarUrl ?? null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.name ?? "",
      email: user?.email ?? "",
      phone: "(415) 555-0142",
      title: "Principal Broker · Luxury Specialist",
      brokerage: user?.brokerage ?? "Civella Premier",
      bio: "",
      licenseNumber: "DRE 01982745",
      nmlsId: "",
    },
  });

  const onSubmit = (values: ProfileValues) => {
    updateUser({ name: values.displayName, email: values.email, avatarUrl: avatar });
    toast("Profile saved.", "success");
    navigate("/agent/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Minimal chrome top bar (full-screen experience) */}
      <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-4 sm:px-8">
        <button onClick={() => navigate("/agent/dashboard")} className="rounded-md" title="⌂ Home">
          <Logo size="sm" />
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted sm:block">Editing profile</span>
          <Button variant="outline" size="sm" onClick={() => navigate("/agent/dashboard")}>
            <X className="h-4 w-4" /> Close
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-strong">Your profile</h1>
          <p className="mt-1 text-muted">This is how clients and colleagues see you across Civella.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isPro ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                <Crown className="h-3 w-3" /> {user?.plan === "enterprise" ? "Enterprise Member" : "Professional Member"}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-subtle px-3 py-1 text-xs font-medium text-muted">Free Plan</span>
            )}
            {user?.planActivatedAt && (
              <span className="text-xs text-muted">Member since {new Date(user.planActivatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
            )}
            {!isPro && (
              <Link to="/pricing"><Button size="sm" variant="outline"><Zap className="h-3 w-3" /> Upgrade</Button></Link>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Avatar uploader */}
          <section className="rounded-xl border border-line bg-surface p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Profile photo</h2>
              <div className="flex items-center gap-2">
                <Avatar name={user?.name ?? "Agent"} src={avatar ?? undefined} size={40} />
                <span className="text-xs text-muted">Preview</span>
              </div>
            </div>
            <div className="mt-4">
              <ImageUploader currentUrl={avatar} onChange={(d) => { setAvatar(d); toast("Photo staged — save to keep it.", "info"); }} onRemove={() => setAvatar(null)} maxSizeMb={5} />
            </div>
          </section>

          {/* Personal info */}
          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Personal information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input id="p-name" label="Display name" error={errors.displayName?.message ?? null} {...register("displayName")} />
              <Input id="p-email" type="email" label="Email" error={errors.email?.message ?? null} {...register("email")} />
              <Input id="p-phone" type="tel" label="Phone" error={errors.phone?.message ?? null} {...register("phone")} />
              <Input id="p-title" label="Title" error={errors.title?.message ?? null} {...register("title")} />
            </div>
          </section>

          {/* Professional */}
          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Professional details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input id="p-brokerage" label="Brokerage" error={errors.brokerage?.message ?? null} {...register("brokerage")} />
              <Input id="p-license" label="License number" {...register("licenseNumber")} />
              <Input id="p-nmls" label="NMLS ID (optional)" {...register("nmlsId")} />
            </div>
            <div className="mt-4">
              <Textarea id="p-bio" label="Bio" rows={4} error={errors.bio?.message ?? null} {...register("bio")} placeholder="Tell clients about your experience and specialties." />
            </div>
          </section>

          <div className={cn("flex justify-end gap-3")}>
            <Button type="button" variant="outline" onClick={() => navigate("/agent/dashboard")}>Cancel</Button>
            <Button type="submit"><Check className="h-4 w-4" /> Save profile</Button>
          </div>
        </form>

        {/* Pro-only profile intelligence */}
        {isPro ? (
          <section className="mt-8 rounded-xl border border-line bg-surface p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
              <Crown className="h-4 w-4 text-accent" /> Profile Intelligence <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white">Pro</span>
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {[["Profile views", "1,248", "+18%"], ["Contact clicks", "94", "+7%"], ["Search appearances", "3,401", "+24%"]].map(([label, value, delta]) => (
                <div key={label} className="rounded-md border border-line p-3 text-center">
                  <p className="text-xl font-semibold text-strong">{value}</p>
                  <p className="text-xs text-success">{delta} this month</p>
                  <p className="mt-0.5 text-xs text-muted">{label}</p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-xl border border-dashed border-line p-6 text-center">
            <Lock className="mx-auto h-8 w-8 text-muted/40" />
            <h3 className="mt-3 font-semibold text-strong">Professional Profile Features</h3>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted">Profile analytics, MLS verification badge and a review showcase unlock on the Professional plan.</p>
            <Link to="/pricing"><Button size="sm" className="mt-4"><Crown className="h-3.5 w-3.5" /> Unlock with Professional</Button></Link>
          </section>
        )}
      </main>
    </div>
  );
}
