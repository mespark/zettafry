import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApiKeyPanel } from "@/components/site/ApiKeyPanel";
import { getUserApiKey } from "@/lib/user-keys";
import { Settings } from "lucide-react"; 
import {
  ArrowUp,
  Camera,
  Copy,
  FileSpreadsheet,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Paperclip,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { CameraCapture } from "@/components/site/CameraCapture";
import { BulkProcess } from "@/components/site/BulkProcess";
import { InvoiceEditor, looksInvoice } from "@/components/site/InvoiceEditor";
import { toast } from "sonner";
import { BrandMark } from "@/components/site/BrandMark";
import { useSession } from "@/lib/use-session";
import { sendChat } from "@/lib/chat.functions";
import { fileToAttachments } from "@/lib/attachments";
import { isAdminEmail } from "@/lib/models";
import { ApiKeyPanel } from "@/components/site/ApiKeyPanel";
import { getUserApiKey } from "@/lib/user-keys";
import { downloadExcel, parseRecords, type Row } from "@/lib/excel";
import { formatReset, getLimits } from "@/lib/quota";
import { fetchUsage, saveExtraction, spendUsage } from "@/lib/usage-client";

import {
  loadThreads,
  newThread,
  saveThreads,
  titleFrom,
  uid,
  type Attachment,
  type ChatMessage,
  type Thread,
} from "@/lib/chat-store";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Zettafry Console — Bills to Excel" },
      {
        name: "description",
        content:
          "Chat with Zettafry: upload invoices, photos or zip files and get clean structured JSON for your books.",
      },
      { property: "og:title", content: "Zettafry Console — Bills to Excel" },
      {
        property: "og:description",
        content:
          "Upload invoice photos, text files or zips and let Zettafry extract vendor, amount, date and GST number.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ConsolePage,
});

function ConsolePage() {
  const { user, loading, signOut } = useSession();
  const navigate = useNavigate();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [limits, setLimits] = useState(getLimits());
  const [usage, setUsage] = useState({ messages: 0, files: 0 });
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState(false);
  /** Extra fields the model should try to extract (none by default). */
  const customFields: string[] = [];
  /** Edited extraction rows, keyed by assistant message id. */
  const [edits, setEdits] = useState<Record<string, Row[]>>({});
  const [bulk, setBulk] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [keyPanelOpen, setKeyPanelOpen] = useState(false);
  const unlimited = isAdminEmail(user?.email);
  const messagesLeft = unlimited ? Infinity : Math.max(0, limits.messages - usage.messages);
  const filesLeft = unlimited ? Infinity : Math.max(0, limits.files - usage.files);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setLimits(getLimits());
    let cancelled = false;
    void fetchUsage().then((u) => {
      if (!cancelled && u) setUsage({ messages: u.messages, files: u.files });
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const stored = loadThreads(user.id);
    if (stored.length) {
      setThreads(stored);
      setActiveId(stored[0]!.id);
    } else {
      const t = newThread();
      setThreads([t]);
      setActiveId(t.id);
    }
  }, [user]);

  useEffect(() => {
    if (user && threads.length) saveThreads(user.id, threads);
  }, [user, threads]);

  const active = useMemo(
    () => threads.find((t) => t.id === activeId) ?? null,
    [threads, activeId],
  );

  const threadRecords = useMemo<Row[]>(() => {
    const rows: Row[] = [];
    for (const m of active?.messages ?? []) {
      if (m.role !== "assistant" || m.error || !/^\s*[[{]/.test(m.text)) continue;
      const edited = edits[m.id];
      if (edited) {
        rows.push(...edited);
        continue;
      }
      const parsed = parseRecords(m.text);
      if (parsed) rows.push(...parsed);
    }
    return rows;
  }, [active, edits]);


  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, busy]);

  const patchThread = (id: string, fn: (t: Thread) => Thread) =>
    setThreads((prev) =>
      prev
        .map((t) => (t.id === id ? fn(t) : t))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    );

  const startNew = () => {
    const t = newThread();
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
    setInput("");
    setPending([]);
    setSidebar(false);
  };

  const removeThread = (id: string) => {
    setThreads((prev) => {
      const rest = prev.filter((t) => t.id !== id);
      if (!rest.length) {
        const t = newThread();
        setActiveId(t.id);
        return [t];
      }
      if (id === activeId) setActiveId(rest[0]!.id);
      return rest;
    });
  };

  const pickFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const all = Array.from(files);
    const singleZip = all.length === 1 && all[0]!.name.toLowerCase().endsWith(".zip");
    if (all.length > 1 && !singleZip) {
      if (!getUserApiKey()) {
        setKeyPanelOpen(true);
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      setBulkFiles(all);
      setBulk(true);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const picked = Array.from(files).slice(0, 5);
    if (!unlimited && picked.length > filesLeft) {
      toast.error(
        filesLeft === 0
          ? `Daily upload limit reached (${limits.files} files). Resets in ${formatReset()}.`
          : `Only ${filesLeft} upload${filesLeft === 1 ? "" : "s"} left today.`,
      );
      if (fileRef.current) fileRef.current.value = "";
      if (filesLeft === 0) return;
    }
    let used = 0;
    for (const file of picked) {
      if (!unlimited && used >= filesLeft) break;
      try {
        const atts = await fileToAttachments(file);
        setPending((prev) => [...prev, ...atts].slice(0, 10));
        used += 1;
        if (user) {
          const res = await spendUsage({ files: 1 }, { limits, unlimited });
          if (res.usage) setUsage(res.usage);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not read file");
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const send = async () => {
    if (busy || !active) return;
    const text = input.trim();
    if (!text && pending.length === 0) return;
    if (!unlimited && messagesLeft <= 0) {
      toast.error(
        `You have reached your free daily limit of ${limits.messages} messages. Resets in ${formatReset()}.`,
      );
      return;
    }
     if (text.length > 1500) {
      toast.error("Message is too long — keep it under 1500 characters.");
      return;
    }
    const savedKey = getUserApiKey();
    if (!savedKey) {
      setKeyPanelOpen(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      text,
      attachments: pending,
      createdAt: Date.now(),
    };

    const history = [...active.messages, userMsg];
    const isFirst = active.messages.length === 0;

    patchThread(active.id, (t) => ({
      ...t,
      title: isFirst ? titleFrom(text, pending) : t.title,
      messages: history,
      updatedAt: Date.now(),
    }));
    setInput("");
    setPending([]);
    setBusy(true);
    if (user) {
      const res = await spendUsage({ messages: 1 }, { limits, unlimited });
      if (res.usage) setUsage(res.usage);
      if (!res.ok && !unlimited) {
        setBusy(false);
        toast.error(
          res.error === "Unauthorized"
            ? "Session expired — sign in again."
            : `You have reached your free daily limit of ${limits.messages} messages. Resets in ${formatReset()}.`,
        );
        return;
      }
    }

    try {
      const payload = history.slice(-12).map((m) => {
        if (m.role === "assistant" || !m.attachments?.length) {
          return { role: m.role, content: m.text };
        }
        const parts: Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        > = [];
        const textParts = m.attachments
          .filter((a) => a.kind === "text")
          .map((a) => `File: ${a.name}\n${a.data}`)
          .join("\n\n");
        const prompt = [m.text, textParts].filter(Boolean).join("\n\n");
        parts.push({ type: "text", text: prompt || "Extract the invoice data." });
        for (const a of m.attachments.filter((x) => x.kind === "image")) {
          parts.push({ type: "image_url", image_url: { url: a.data } });
        }
        return { role: m.role, content: parts };
      });

        const result = await sendChat({
        data: {
          messages: payload,
          ...(customFields.length ? { customFields } : {}),
          provider: savedKey.provider,
          apiKey: savedKey.apiKey,
          ...(savedKey.model ? { model: savedKey.model } : {}),
        },
      });
      const reply: ChatMessage = {
        id: uid(),
        role: "assistant",
        text: result.ok ? result.text : result.error,
        error: !result.ok,
        createdAt: Date.now(),
      };
      if (!result.ok) toast.error(result.error);
      patchThread(active.id, (t) => ({
        ...t,
        messages: [...t.messages, reply],
        updatedAt: Date.now(),
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
      patchThread(active.id, (t) => ({
        ...t,
        messages: [
          ...t.messages,
          {
            id: uid(),
            role: "assistant",
            text: message,
            error: true,
            createdAt: Date.now(),
          },
        ],
        updatedAt: Date.now(),
      }));
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-card/60 backdrop-blur-xl transition-transform md:static md:translate-x-0 ${
          sidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <BrandMark className="size-8" />
            <span className="font-display text-xs font-semibold">Zettafry — Bills to Excel</span>
          </Link>
          <button
            aria-label="Close sidebar"
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setSidebar(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-3">
          <button
            onClick={startNew}
            className="flex w-full items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <Plus className="size-4 text-primary" />
            New chat
          </button>
        </div>

        <div className="mt-5 flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-1 pb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            History
          </p>
          <ul className="space-y-1">
            {threads.map((t) => (
              <li key={t.id} className="group relative">
                <button
                  onClick={() => {
                    setActiveId(t.id);
                    setSidebar(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 pr-9 text-left text-sm transition-colors ${
                    t.id === activeId
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="size-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{t.title}</span>
                </button>
                <button
                  aria-label="Delete chat"
                  onClick={() => removeThread(t.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 px-1 pb-2.5">
            {user.photo ? (
              <img src={user.photo} alt="" className="size-8 rounded-full object-cover" />
            ) : (
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                {(user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm">{user.name ?? "Signed in"}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/auth" });
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </aside>

      {sidebar && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-background/70 md:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      {/* Main */}
      <main
        className="flex min-w-0 flex-1 flex-col"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void pickFiles(e.dataTransfer?.files ?? null);
        }}
      >
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button
            aria-label="Open sidebar"
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setSidebar(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-sm">
              {active?.title ?? "New chat"}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Zettafry · invoice extraction assistant
            </p>
          </div>
         <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setKeyPanelOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              title="AI provider settings"
            >
              <Settings className="size-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            {threadRecords.length ? (
              <button
                onClick={() => downloadExcel(threadRecords, "zettafry-conversation")}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <FileSpreadsheet className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Download all as Excel</span>
                <span className="sm:hidden">Excel</span>
              </button>
            ) : null}

            {unlimited ? (
              <Link
                to="/admin"
                className="rounded-full border border-primary/50 px-3 py-1.5 text-[11px] uppercase tracking-widest text-primary"
              >
                Admin
              </Link>
            ) : null}
            <span className="hidden rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-[11px] text-muted-foreground sm:inline">
              {unlimited
                ? "Owner · unlimited"
                : `${messagesLeft} messages · ${filesLeft} uploads left · resets in ${formatReset()}`}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-8">
            {!active?.messages.length ? (
              <div className="mt-10 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/15">
                  <Sparkles className="size-6 text-primary" />
                </div>
                <h2 className="mt-5 font-display text-2xl">
                  Hi{user.name ? `, ${user.name.split(" ")[0]}` : ""} — what are we
                  filing today?
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Paste invoice text, drop an invoice photo, or upload a zip of bills.
                  Zettafry returns clean JSON with vendor, amount, date and GST number.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {[
                    "Extract data from this invoice",
                    "Read this GST bill photo",
                    "Summarise this zip of bills",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {active.messages.map((m) => (
                  <Bubble
                    key={m.id}
                    message={m}
                    edited={edits[m.id] ?? null}
                    onEdit={(rows) => setEdits((prev) => ({ ...prev, [m.id]: rows }))}
                  />
                ))}
                {busy && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    Zettafry is reading…
                  </div>
                )}
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            {pending.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {pending.map((a, i) => (
                  <span
                    key={`${a.name}-${i}`}
                    className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-2 py-1.5 text-xs"
                  >
                    {a.kind === "image" ? (
                      <img src={a.data} alt="" className="size-7 rounded object-cover" />
                    ) : (
                      <Paperclip className="size-3.5 text-primary" />
                    )}
                    <span className="max-w-40 truncate">{a.name}</span>
                    <button
                      aria-label="Remove attachment"
                      onClick={() => setPending((p) => p.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div
              className={`flex items-end gap-2 rounded-2xl border bg-card/60 p-2 backdrop-blur-xl focus-within:border-primary/50 ${
                dragging ? "border-primary/70" : "border-border"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,application/pdf,.pdf,.zip,.txt,.csv,.json,.md,.xml,.html"
                className="hidden"
                onChange={(e) => pickFiles(e.target.files)}
              />
              <button
                aria-label="Attach file"
                onClick={() => fileRef.current?.click()}
                className="rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Paperclip className="size-4" />
              </button>
              <button
                aria-label="Take a photo"
                onClick={() => {
                  if (!unlimited && filesLeft <= 0) {
                    toast.error(
                      `Daily upload limit reached (${limits.files} files). Resets in ${formatReset()}.`,
                    );
                    return;
                  }
                  setCamera(true);
                }}
                className="rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Camera className="size-4" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={1}
                placeholder="Message Zettafry — or attach an invoice, photo or zip…"
                className="max-h-40 flex-1 resize-none bg-transparent px-1 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                aria-label="Send message"
                onClick={() => void send()}
                disabled={busy || (!input.trim() && pending.length === 0)}
                className="rounded-xl bg-primary p-2.5 text-primary-foreground transition-shadow hover:shadow-[0_0_24px_var(--glow)] disabled:opacity-40 disabled:shadow-none"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              PDFs, images, camera photos, text files and .zip archives supported
              {unlimited
                ? ""
                : ` · free plan: ${limits.messages} messages and ${limits.files} uploads a day`}{" "}
              · always verify extracted figures before filing.
            </p>
          </div>
        </div>
       </main>

      <ApiKeyPanel
        open={keyPanelOpen}
        onOpenChange={setKeyPanelOpen}
        onSaved={() => toast.success("API key saved — ab chat bhej sakte ho.")}
      />

      <CameraCapture
        open={camera}
        onClose={() => setCamera(false)}
        onCapture={(photo) => {
          setPending((prev) =>
            [...prev, { kind: "image" as const, name: photo.name, data: photo.data }].slice(0, 10),
          );
          if (user) {
            void spendUsage({ files: 1 }, { limits, unlimited }).then((res) => {
              if (res.usage) setUsage(res.usage);
            });
          }
          toast.success("Photo attached");
        }}
      <BulkProcess
        open={bulk}
        files={bulkFiles}
        allowance={unlimited ? Infinity : Math.min(filesLeft, messagesLeft)}
        provider={getUserApiKey()?.provider ?? "groq"}
        apiKey={getUserApiKey()?.apiKey ?? ""}
        {...(getUserApiKey()?.model ? { model: getUserApiKey()!.model } : {})}
        {...(customFields.length ? { customFields } : {})}
        onSpend={() => {
          if (!user) return;
          void spendUsage({ files: 1, messages: 1 }, { limits, unlimited }).then((res) => {
            if (res.usage) setUsage(res.usage);
          });
        }}
        onClose={() => {
          setBulk(false);
          setBulkFiles([]);
        }}
        onFinish={({ total, ok, failed, rows }) => {
          if (!active) return;
          const id = uid();
          patchThread(active.id, (t) => ({
            ...t,
            title: t.messages.length === 0 ? `Bulk · ${total} bills` : t.title,
            messages: [
              ...t.messages,
              {
                id,
                role: "assistant" as const,
                text: `Processed ${total} bill${total === 1 ? "" : "s"} · ${ok} succeeded, ${failed} failed`,
                createdAt: Date.now(),
              },
            ],
            updatedAt: Date.now(),
          }));
          if (rows.length) setEdits((prev) => ({ ...prev, [id]: rows }));
        }}
      />

    </div>
  );
}

function Bubble({
  message,
  edited,
  onEdit,
}: {
  message: ChatMessage;
  edited?: Row[] | null;
  onEdit?: (rows: Row[]) => void;
}) {
  const isUser = message.role === "user";
  const looksJson = !isUser && /^\s*[[{]/.test(message.text);
  const parsed = looksJson && !message.error ? parseRecords(message.text) : null;
  const editable = looksInvoice(parsed);
  const records = edited ?? parsed;
  const wasEdited = !!edited;
  const asJson = () => {
    if (!records) return message.text;
    const single = Array.isArray(parsed) && parsed.length === 1 && !/^\s*\[/.test(message.text);
    return JSON.stringify(single ? records[0] : records, null, 2);
  };



  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div className={isUser ? "max-w-[85%]" : "w-full"}>
        {message.attachments?.length ? (
          <div className="mb-2 flex flex-wrap justify-end gap-2">
            {message.attachments.map((a, i) => (
              <span key={`${a.name}-${i}`}>
                {a.kind === "image" ? (
                  <img
                    src={a.data}
                    alt={a.name}
                    className="size-24 rounded-xl border border-border object-cover"
                  />
                ) : (
                  <span className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-2.5 py-1.5 text-xs">
                    <Paperclip className="size-3.5 text-primary" />
                    <span className="max-w-40 truncate">{a.name}</span>
                  </span>
                )}
              </span>
            ))}
          </div>
        ) : null}

        {message.text ? (
          isUser ? (
            <div className="rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-sm whitespace-pre-wrap">
              {message.text}
            </div>
          ) : (
            <div className="group relative">
              <div className="mb-1.5 flex items-center gap-2 text-[11px] uppercase tracking-widest text-primary">
                <Sparkles className="size-3" /> Zettafry
              </div>
              {editable && records ? (
                <InvoiceEditor
                  records={records}
                  onChange={(next) => onEdit?.(next)}
                />
              ) : looksJson ? (
                <pre className="overflow-x-auto rounded-xl border border-border bg-card/70 p-4 text-xs leading-relaxed">
                  <code>{message.text}</code>
                </pre>
              ) : (
                <p
                  className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    message.error ? "text-destructive" : ""
                  }`}
                >
                  {message.text}
                </p>
              )}
              <div className="mt-2 flex items-center gap-3">
                <button
                  aria-label="Copy answer"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      editable ? asJson() : message.text,
                    );
                    toast.success("Copied");
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground opacity-0 transition hover:text-foreground group-hover:opacity-100"
                >
                  <Copy className="size-3" /> Copy
                </button>
                {records ? (
                  <button
                    aria-label="Download Excel"
                    onClick={() => downloadExcel(records)}
                    className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground opacity-0 transition hover:text-foreground group-hover:opacity-100"
                  >
                    <FileSpreadsheet className="size-3" /> Download Excel
                  </button>
                ) : null}
                {editable && wasEdited ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-primary">
                    <span className="size-1.5 rounded-full bg-primary" />
                    Edited · not yet exported
                  </span>
                ) : null}
              </div>


            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
