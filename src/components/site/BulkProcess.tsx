import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Loader2,
  Play,
  X,
  XCircle,
} from "lucide-react";
import { fileToAttachments } from "@/lib/attachments";
import { sendChat } from "@/lib/chat.functions";
import { downloadExcel, parseRecords, type Row } from "@/lib/excel";

type Status = "queued" | "processing" | "done" | "failed" | "skipped";

type Item = {
  id: string;
  file: File;
  name: string;
  thumb: string | null;
  status: Status;
  error?: string;
  rows?: Row[];
};

const CONCURRENCY = 2;

const badge: Record<Status, string> = {
  queued: "border-border text-muted-foreground",
  processing: "border-primary/60 text-primary",
  done: "border-emerald-500/50 text-emerald-400",
  failed: "border-destructive/60 text-destructive",
  skipped: "border-border text-muted-foreground",
};

const label: Record<Status, string> = {
  queued: "Queued",
  processing: "Processing",
  done: "Done",
  failed: "Failed",
  skipped: "Skipped · limit",
};

const flatOf = (r: Row): Row => {
  const out: Row = {};
  for (const [k, v] of Object.entries(r)) {
    if (k === "line_items") continue;
    if (k === "custom_fields" && v && typeof v === "object" && !Array.isArray(v)) {
      for (const [ck, cv] of Object.entries(v as Row)) out[ck] = cv;
      continue;
    }
    out[k] = v;
  }
  return out;
};

const cell = (v: unknown) =>
  v === null || v === undefined
    ? "—"
    : typeof v === "object"
      ? JSON.stringify(v)
      : String(v);

/** Read-only preview table for the finished batch. */
function PreviewTable({ title, rows }: { title: string; rows: Row[] }) {
  const columns = useMemo(() => {
    const keys: string[] = [];
    for (const r of rows) for (const k of Object.keys(r)) if (!keys.includes(k)) keys.push(k);
    return keys;
  }, [rows]);
  if (!rows.length) return null;
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="max-h-52 overflow-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-card/95 backdrop-blur">
            <tr>
              {columns.map((c) => (
                <th
                  key={c}
                  className="whitespace-nowrap border-b border-border px-2 py-1.5 text-left font-normal text-muted-foreground"
                >
                  {c.replace(/[_-]+/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                {columns.map((c) => (
                  <td key={c} className="whitespace-nowrap px-2 py-1 align-top">
                    {cell(r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Bulk bill processing panel: run extraction per file, preview and export. */
export function BulkProcess({
  open,
  files,
  onClose,
  onFinish,
  provider,
  apiKey,
  model,
  customFields,
  allowance,
  onSpend,
}: {
  open: boolean;
  files: File[];
  onClose: () => void;
  /** Called once when the batch finishes, so a summary can land in the chat. */
  onFinish: (summary: { total: number; ok: number; failed: number; rows: Row[] }) => void;
  /** Which AI provider to use — comes from the user's saved key in Settings. */
  provider: "groq" | "gemini" | "openrouter";
  /** The user's own API key for that provider. */
  apiKey: string;
  model?: string;
  customFields?: string[];
  /** How many files may still be processed today (Infinity for owners). */
  allowance: number;
  /** Report one processed file so daily usage can be recorded. */
  onSpend: () => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    if (!open) return;
    cancelled.current = false;
    setRunning(false);
    setFinished(false);
    setItems(
      files.map((file, i) => ({
        id: `${i}-${file.name}`,
        file,
        name: file.name,
        thumb: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        status: "queued" as Status,
      })),
    );
  }, [open, files]);

  useEffect(
    () => () => {
      items.forEach((it) => it.thumb && URL.revokeObjectURL(it.thumb));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const runnable = Number.isFinite(allowance)
    ? Math.min(items.length, Math.max(0, allowance))
    : items.length;
  const processed = items.filter((i) => i.status === "done" || i.status === "failed").length;
  const okItems = items.filter((i) => i.status === "done");
  const failedCount = items.filter((i) => i.status === "failed").length;
  const rows = okItems.flatMap((i) => i.rows ?? []);
  const invoiceRows = rows.map(flatOf).filter((r) => Object.keys(r).length);
  const itemRows = rows.flatMap((r, i) =>
    Array.isArray(r["line_items"])
      ? (r["line_items"] as unknown[])
          .filter((x): x is Row => !!x && typeof x === "object" && !Array.isArray(x))
          .map((li) => ({
            invoice_ref: String(r["invoice_number"] ?? r["vendor_name"] ?? `Invoice ${i + 1}`),
            ...li,
          }))
      : [],
  );

  const patch = (id: string, next: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...next } : it)));

  const processOne = async (item: Item) => {
    patch(item.id, { status: "processing" });
    try {
      const atts = await fileToAttachments(item.file);
      const textParts = atts
        .filter((a) => a.kind === "text")
        .map((a) => `File: ${a.name}\n${a.data}`)
        .join("\n\n");
      const parts: Array<
        { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
      > = [
        {
          type: "text",
          text: ["Extract the invoice data from this bill.", textParts]
            .filter(Boolean)
            .join("\n\n"),
        },
      ];
      for (const a of atts.filter((x) => x.kind === "image")) {
        parts.push({ type: "image_url", image_url: { url: a.data } });
      }
       const result = await sendChat({
        data: {
          messages: [{ role: "user" as const, content: parts }],
          provider,
          apiKey,
          ...(model ? { model } : {}),
          ...(customFields?.length ? { customFields } : {}),
        },
      });
      onSpend();
      if (!result.ok) throw new Error(result.error);
      const parsed = parseRecords(result.text.trim());
      if (!parsed) throw new Error("Model did not return structured invoice data");
      patch(item.id, { status: "done", rows: parsed });
    } catch (err) {
      patch(item.id, {
        status: "failed",
        error: err instanceof Error ? err.message : "Could not process this file",
      });
    }
  };

  const start = async () => {
    if (running) return;
    setRunning(true);
    const queue = items.slice(0, runnable);
    setItems((prev) =>
      prev.map((it, i) => (i >= runnable ? { ...it, status: "skipped" as Status } : it)),
    );
    let cursor = 0;
    const worker = async () => {
      while (!cancelled.current) {
        const next = queue[cursor++];
        if (!next) return;
        await processOne(next);
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
    setRunning(false);
    setFinished(true);
  };

  const close = () => {
    cancelled.current = true;
    if (finished || okItems.length || failedCount) {
      onFinish({
        total: okItems.length + failedCount,
        ok: okItems.length,
        failed: failedCount,
        rows,
      });
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="font-display text-sm">Bulk processing</h2>
            <p className="text-[11px] text-muted-foreground">
              {finished
                ? `${okItems.length} succeeded · ${failedCount} failed`
                : running
                  ? `${processed} of ${runnable} processed`
                  : `${items.length} file${items.length === 1 ? "" : "s"} ready`}
            </p>
          </div>
          <button
            aria-label="Close bulk processing"
            onClick={close}
            className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {!running && !finished && runnable < items.length ? (
          <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Your daily limit allows {runnable} of {items.length} files. The rest will stay
              queued for tomorrow.
            </span>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <ul className="space-y-1.5">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-2.5 py-2"
              >
                {it.thumb ? (
                  <img src={it.thumb} alt="" className="size-9 rounded-lg object-cover" />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-lg bg-secondary">
                    <FileText className="size-4 text-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs">{it.name}</p>
                  {it.error ? (
                    <p className="truncate text-[11px] text-destructive">{it.error}</p>
                  ) : null}
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${badge[it.status]}`}
                >
                  {it.status === "processing" ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : it.status === "done" ? (
                    <CheckCircle2 className="size-3" />
                  ) : it.status === "failed" ? (
                    <XCircle className="size-3" />
                  ) : null}
                  {label[it.status]}
                </span>
              </li>
            ))}
          </ul>

          {finished ? (
            <>
              <PreviewTable title="Invoices" rows={invoiceRows} />
              <PreviewTable title="Line items" rows={itemRows} />
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          <p className="text-[11px] text-muted-foreground">
            {running
              ? "Processing one bill at a time — keep this open."
              : finished
                ? `${okItems.length + failedCount} processed`
                : "Results are collected here, not posted as separate chat messages."}
          </p>
          <div className="ml-auto flex items-center gap-2">
            {finished && rows.length ? (
              <button
                onClick={() => downloadExcel(rows, "zettafry-bulk")}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-[11px] transition-colors hover:border-primary/50"
              >
                <FileSpreadsheet className="size-3.5 text-primary" />
                Download all as Excel
              </button>
            ) : null}
            {finished ? (
              <button
                onClick={close}
                className="rounded-full bg-primary px-4 py-1.5 text-[11px] font-medium text-primary-foreground"
              >
                Done
              </button>
            ) : (
              <button
                onClick={() => void start()}
                disabled={running || runnable === 0}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[11px] font-medium text-primary-foreground disabled:opacity-40"
              >
                {running ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Play className="size-3.5" />
                )}
                {running ? "Processing…" : `Start (${runnable})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
