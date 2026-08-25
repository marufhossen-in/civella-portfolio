import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, "Please enter your full name"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirm: z.string().min(1, "Please confirm your password"),
    role: z.enum(["agent", "admin"]),
    plan: z.enum(["starter", "pro", "enterprise"]).optional(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  })
  .refine((d) => d.role, { message: "Select a role", path: ["role"] });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;

/** 0–4 strength score from password composition (client-side UX only). */
export function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  score = Math.min(4, score);
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[score] ?? "Too weak" };
}

// ── Lead / Showing ────────────────────────────────────────────────────────
export const leadSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone number"),
  message: z.string().min(10, "Please share a few details"),
});
export type LeadValues = z.infer<typeof leadSchema>;

export const showingSchema = leadSchema.extend({
  preferredDate: z.string().min(1, "Pick a date"),
  timeSlot: z.enum(["morning", "afternoon"]),
  notes: z.string().optional(),
});
export type ShowingValues = z.infer<typeof showingSchema>;

export const valuationSchema = z.object({
  address: z.string().min(6, "Enter a full street address"),
});
export type ValuationValues = z.infer<typeof valuationSchema>;

export const newsletterSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
export type NewsletterValues = z.infer<typeof newsletterSchema>;

// ── Payment (UI-only — no processing) ─────────────────────────────────────
export const paymentSchema = z.object({
  cardName: z.string().min(2, "Name on card is required"),
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => /^\d{15,16}$/.test(v), "Enter a valid 16-digit card number"),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY format"),
  cvv: z.string().regex(/^\d{3,4}$/, "3–4 digits"),
  billingAddress: z.string().min(4, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP"),
});
export type PaymentValues = z.infer<typeof paymentSchema>;

// ── Profile ───────────────────────────────────────────────────────────────
export const profileSchema = z.object({
  displayName: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone"),
  title: z.string().min(2, "Title is required"),
  brokerage: z.string().min(2, "Brokerage is required"),
  bio: z.string().max(600, "Keep it under 600 characters").optional(),
  licenseNumber: z.string().optional(),
  nmlsId: z.string().optional(),
});
export type ProfileValues = z.infer<typeof profileSchema>;
