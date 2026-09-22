import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { BrandMark } from "@/components/site/BrandMark";
import { Starfield } from "@/components/site/Starfield";
import { getFirebaseAuth, googleProvider, firebaseConfigured } from "@/lib/firebase";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Zettafry Bills to Excel" },
      {
        name: "description",
        content: "Sign in to Zettafry — Bills to Excel with a one-time code sent to your email, or continue with Google.",
      },
      { property: "og:title", content: "Sign in — Zettafry Bills to Excel" },
      { property: "og:description", content: "Access your Zettafry invoice automation console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);

function firebaseMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/unauthorized-domain":
      return "This domain isn't authorized in Firebase. Add it under Authentication → Settings → Authorized domains.";
    case "auth/operation-not-allowed":
      return "Google sign-in is disabled in Firebase. Enable it under Authentication → Sign-in method.";
    case "auth/popup-blocked":
      return "Your browser blocked the popup — allow popups and try again.";
    case "auth/network-request-failed":
      return "Network error — check your connection and try again.";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid":
      return "Firebase API key is invalid for this site.";
    default:
      return (err instanceof Error ? err.message : "Google sign-in failed").replace("Firebase: ", "");
  }
}

function AuthPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") navigate({ to: "/app" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  // Complete Google sign-in when the popup was blocked and we fell back to a redirect.
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    let cancelled = false;
    (async () => {
      try {
        const { getRedirectResult } = await import("firebase/auth");
        const result = await getRedirectResult(auth);
        if (!cancelled && result?.user) {
          toast.success(`Welcome${result.user.displayName ? `, ${result.user.displayName}` : ""}!`);
          navigate({ to: "/app" });
        }
      } catch (err) {
        if (!cancelled) toast.error(firebaseMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    if (!auth || !firebaseConfigured) {
      toast.error("Google sign-in unavailable — Firebase keys missing in this environment.");
      return;
    }
    setGoogleLoading(true);
    try {
      const { signInWithPopup, signInWithRedirect } = await import("firebase/auth");
      googleProvider.setCustomParameters({ prompt: "select_account" });
      try {
      const result = await signInWithPopup(auth, googleProvider);
      toast.success(`Welcome${result.user.displayName ? `, ${result.user.displayName}` : ""}!`);
      navigate({ to: "/app" });
      } catch (popupErr) {
        const code = (popupErr as { code?: string })?.code ?? "";
        if (
          code === "auth/popup-blocked" ||
          code === "auth/operation-not-supported-in-this-environment" ||
          code === "auth/cancelled-popup-request"
        ) {
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        throw popupErr;
      }
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user") return;
      toast.error(firebaseMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    const supabase = getSupabase();
    if (!supabase || !supabaseConfigured) {
      toast.error("Email sign-in unavailable — Supabase keys missing in this environment.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      toast.error(
        error.message.toLowerCase().includes("rate")
          ? "Too many requests — please wait a minute and try again."
          : error.message,
      );
      return;
    }
    setEmail(parsed.data);
    setStep("otp");
    toast.success("Code sent — check your inbox.");
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      toast.error("Email sign-in unavailable — Supabase keys missing in this environment.");
      return;
    }
    setLoading(true);
    let { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    if (error) {
      // Some projects issue the code as a magic-link token type.
      const retry = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "magiclink",
      });
      if (!retry.error) error = null;
    }
    setLoading(false);
    if (error) {
      toast.error(
        error.message.toLowerCase().includes("expired")
          ? "That code expired — send a new one."
          : "Invalid code. Check the 6 digits and try again.",
      );
      return;
    }
    toast.success("Signed in!");
    navigate({ to: "/app" });
  };

  const field =
    "w-full rounded-xl border border-border bg-input/30 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/30";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24">
      <Starfield className="pointer-events-none absolute inset-0 h-full w-full opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.82 0.14 192 / 30%), transparent 65%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to site
        </Link>

        <div className="glass animate-rise rounded-3xl p-8">
          <div className="flex flex-col items-center text-center">
            <BrandMark className="size-16" />
            <h1 className="mt-5 font-display text-2xl font-semibold">Zettafry — Bills to Excel</h1>
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Intelligence. Automated.
            </p>
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={googleLoading}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary"
          >
            {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />} Continue with Google
          </button>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {step === "email" ? (
            <form onSubmit={sendCode} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={field}
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[0_0_30px_var(--glow)] disabled:opacity-60"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                Send one-time code
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                We sent a 6-digit code to <span className="text-foreground">{email}</span>
              </p>
              <input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className={`${field} text-center text-lg tracking-[0.8em]`}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[0_0_30px_var(--glow)]"
              >
                Verify and sign in
              </button>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Use a different email
              </button>
            </form>
          )}

          <p className="mt-6 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" /> Protected by one-time code verification
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.6c-.1 1.1-.9 2.8-2.5 3.9l3.8 3c2.3-2.1 3.6-5.2 3.6-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-3c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5l-4 3.1C3.3 21.3 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3l-4-3.1C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c2.2 0 3.7.9 4.5 1.7l3.3-3.2C17.9 1.4 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4 3.1C6.2 6.8 8.9 4.8 12 4.8z" />
    </svg>
  );
}