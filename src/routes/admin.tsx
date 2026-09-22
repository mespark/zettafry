import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/use-session";
import { MODEL_CHAIN, isAdminEmail } from "@/lib/models";
import { sendChat } from "@/lib/chat.functions";
import { DEFAULT_LIMITS, formatReset } from "@/lib/quota";
import { fetchConfig, saveConfig } from "@/lib/admin-config-client";
import { fetchUsage, resetUsage } from "@/lib/usage-client";
import { loadThreads } from "@/lib/chat-store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Zettafry Admin — Models and Usage" },
      {
        name: "description",
        content:
          "Owner console for Zettafry: pick the active extraction model, tune free daily limits and check model health.",
      },
      { property: "og:title", content: "Zettafry Admin console" },
      {
        property: "og:description",
        content:
          "Select the active AI model, edit free-tier limits and run live model health checks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  const [model, setModel] = useState<string | null>(null);
  const [limits, setLocalLimits] = useState(DEFAULT_LIMITS);
  const [usage, setUsage] = useState({ messages: 0, files: 0 });
  const [threads, setThreads] = useState(0);
  const [testing, setTesting] = useState<string | null>(null);
  const [health, setHealth] = useState<Record<string, "ok" | "fail">>({});
  const [configLoading, setConfigLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const allowed = !loading && isAdminEmail(user?.email);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user || !allowed) return;
    let cancelled = false;

    void fetchConfig().then((cfg) => {
      if (cancelled) return;
      setModel(cfg.preferredModel ?? MODEL_CHAIN[0]!.id);
      setLocalLimits(cfg.limits);
      setConfigLoading(false);
    });

    void fetchUsage().then((u) => {
      if (cancelled || !u) return;
      setUsage(u);
    });

    setThreads(loadThreads(user.id).length);
    return () => {
      cancelled = true;
    };
  }, [user, allowed]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <ShieldCheck className="size-8 text-destructive" />
        <h1 className="font-display text-2xl">Admin access only</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          This console is restricted to the Zettafry owner account. You are signed in as{" "}
          {user?.email ?? "an unknown account"}.
        </p>
        <Link
          to="/app"
          className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Back to Zettafry
        </Link>
      </div>
    );
  }

  const pickModel = async (id: string) => {
    setModel(id);
    setSaving(true);
    const res = await saveConfig({ preferredModel: id });
    setSaving(false);
    if (res.ok) toast.success("Active model updated for everyone");
    else toast.error(res.error ?? "Could not save — try again");
  };

  const saveLimits = async () => {
    setSaving(true);
    const res = await saveConfig({ messages: limits.messages, files: limits.files });
    setSaving(false);
    if (res.ok) toast.success("Limits saved for everyone");
    else toast.error(res.error ?? "Could not save — try again");
  };

  const testModel = async (id: string) => {
    setTesting(id);
    try {
      const res = await sendChat({
        data: { messages: [{ role: "user", content: "ping" }], model: id },
      });
      const first = res.attempts[0];
      const ok = res.ok && first === id;
      setHealth((h) => ({ ...h, [id]: ok ? "ok" : "fail" }));
      toast[ok ? "success" : "error"](
        ok ? `${id} responded` : `${id} did not answer — chain fell back`,
      );
    } catch {
      setHealth((h) => ({ ...h, [id]: "fail" }));
      toast.error("Health check failed");
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary">
              Admin console
            </p>
            <h1 className="mt-1 font-display text-3xl">Zettafry control room</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Signed in as {user?.email} · changes here apply to every user, everywhere
            </p>
          </div>
          <Link
            to="/app"
            className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Console
          </Link>
        </div>

        <section className="rounded-2xl border border-border bg-card/60 p-5">
          <h2 className="flex items-center gap-2 font-display text-lg">
            <Cpu className="size-4 text-primary" /> Active model
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This pick is tried first for every user (via Groq/HF); if it fails, Zettafry
            automatically walks the rest of the chain in order.
          </p>
          {configLoading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading current config…
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {MODEL_CHAIN.map((m, i) => (
                <div
                  key={m.id}
                  className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${
                    model === m.id ? "border-primary/60 bg-primary/5" : "border-border"
                  }`}
                >
                  <button
                    onClick={() => void pickModel(m.id)}
                    disabled={m.chat === false || saving}
                    className="flex-1 text-left disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <p className="text-sm font-medium">
                      {i + 1}. {m.label}
                      {model === m.id && (
                        <span className="ml-2 text-[11px] uppercase tracking-widest text-primary">
                          active
                        </span>
                      )}
                      {m.chat === false && (
                        <span className="ml-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                          specialist
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.note}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/70">
                      {m.id}
                    </p>
                  </button>
                  {health[m.id] === "ok" && (
                    <CheckCircle2 className="size-4 text-primary" />
                  )}
                  {health[m.id] === "fail" && (
                    <XCircle className="size-4 text-destructive" />
                  )}
                  <button
                    onClick={() => void testModel(m.id)}
                    disabled={testing !== null || m.chat === false}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {testing === m.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      "Test"
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card/60 p-5">
          <h2 className="font-display text-lg">Free daily limits</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Applies to every free account, everywhere. Counters reset at local midnight
            (next reset in {formatReset()}).
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Messages per day
              <input
                type="number"
                min={1}
                value={limits.messages}
                onChange={(e) =>
                  setLocalLimits((l) => ({
                    ...l,
                    messages: Number(e.target.value),
                  }))
                }
                className="mt-1 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </label>
            <label className="text-sm">
              File uploads per day
              <input
                type="number"
                min={1}
                value={limits.files}
                onChange={(e) =>
                  setLocalLimits((l) => ({ ...l, files: Number(e.target.value) }))
                }
                className="mt-1 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </label>
          </div>
          <button
            onClick={() => void saveLimits()}
            disabled={saving}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save limits"}
          </button>
        </section>

        <section className="rounded-2xl border border-border bg-card/60 p-5">
          <h2 className="font-display text-lg">Your usage today</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Stat label="Messages" value={`${usage.messages}/${limits.messages}`} />
            <Stat label="Files" value={`${usage.files}/${limits.files}`} />
            <Stat label="Saved chats" value={String(threads)} />
          </div>
          <button
            onClick={async () => {
              const next = await resetUsage();
              if (next) {
                setUsage(next);
                toast.success("Usage reset");
              } else {
                toast.error("Could not reset — try again");
              }
            }}
            className="mt-4 flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="size-4" /> Reset my counters
          </button>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-xl">{value}</p>
    </div>
  );
}
