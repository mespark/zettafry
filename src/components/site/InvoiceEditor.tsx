import { Plus, X } from "lucide-react";
import type { Row } from "@/lib/excel";

const INVOICE_KEYS = [
  "vendor_name",
  "vendor_address",
  "invoice_number",
  "invoice_date",
  "due_date",
  "gst_number",
  "subtotal",
  "cgst",
  "sgst",
  "igst",
  "discount",
  "total_amount",
  "line_items",
  "custom_fields",
];

const ITEM_KEYS = ["description", "qty", "quantity", "unit_price", "rate", "amount", "total"];

const isObj = (v: unknown): v is Row =>
  !!v && typeof v === "object" && !Array.isArray(v);

export const labelFor = (key: string) =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bGst\b/g, "GST")
    .replace(/\bCgst\b/g, "CGST")
    .replace(/\bSgst\b/g, "SGST")
    .replace(/\bIgst\b/g, "IGST")
    .replace(/\bQty\b/g, "Qty");

/** True when the parsed rows look like invoice records we can edit in a table. */
export function looksInvoice(rows: Row[] | null): rows is Row[] {
  if (!rows?.length) return false;
  return rows.every((r) => {
    const keys = Object.keys(r);
    if (!keys.length) return false;
    if (keys.some((k) => INVOICE_KEYS.includes(k))) return true;
    // custom-field-only records: all values must be primitives
    return keys.every((k) => !Array.isArray(r[k]) && !isObj(r[k]));
  });
}

const toText = (v: unknown) =>
  v === null || v === undefined
    ? ""
    : typeof v === "object"
      ? JSON.stringify(v)
      : String(v);

const cellClass =
  "w-full rounded-md border border-border/70 bg-background/60 px-2 py-1 text-xs outline-none transition-colors focus:border-primary/60";

function itemColumns(items: Row[]): string[] {
  const keys: string[] = [];
  for (const item of items) {
    for (const k of Object.keys(item)) if (!keys.includes(k)) keys.push(k);
  }
  if (!keys.length) return ["description", "qty", "unit_price", "amount"];
  return keys.sort((a, b) => {
    const ia = ITEM_KEYS.indexOf(a);
    const ib = ITEM_KEYS.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

/** Editable card for one extracted invoice record. */
function RecordCard({
  record,
  index,
  total,
  onChange,
}: {
  record: Row;
  index: number;
  total: number;
  onChange: (next: Row) => void;
}) {
  const flatEntries = Object.entries(record).filter(
    ([k, v]) => k !== "line_items" && k !== "custom_fields" && !Array.isArray(v) && !isObj(v),
  );
  const custom = isObj(record["custom_fields"]) ? (record["custom_fields"] as Row) : null;
  const items = Array.isArray(record["line_items"])
    ? (record["line_items"] as unknown[]).filter(isObj)
    : null;
  const columns = items ? itemColumns(items) : [];

  const setField = (key: string, value: string) => onChange({ ...record, [key]: value });
  const setCustom = (key: string, value: string) =>
    onChange({ ...record, custom_fields: { ...(custom ?? {}), [key]: value } });

  const setItem = (rowIndex: number, key: string, value: string) => {
    const next = (items ?? []).map((it, i) => (i === rowIndex ? { ...it, [key]: value } : it));
    onChange({ ...record, line_items: next });
  };
  const addItem = () =>
    onChange({
      ...record,
      line_items: [
        ...(items ?? []),
        Object.fromEntries((columns.length ? columns : ["description"]).map((k) => [k, ""])),
      ],
    });
  const removeItem = (rowIndex: number) =>
    onChange({ ...record, line_items: (items ?? []).filter((_, i) => i !== rowIndex) });

  return (
    <div className="rounded-xl border border-border bg-card/70 p-3">
      {total > 1 ? (
        <p className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
          Invoice {index + 1}
        </p>
      ) : null}

      <div className="space-y-1.5">
        {flatEntries.map(([key, value]) => (
          <div key={key} className="grid grid-cols-[minmax(96px,34%)_1fr] items-center gap-2">
            <span className="truncate text-[11px] text-muted-foreground">{labelFor(key)}</span>
            <input
              value={toText(value)}
              onChange={(e) => setField(key, e.target.value)}
              className={cellClass}
              aria-label={labelFor(key)}
            />
          </div>
        ))}
        {custom
          ? Object.entries(custom).map(([key, value]) => (
              <div
                key={`custom-${key}`}
                className="grid grid-cols-[minmax(96px,34%)_1fr] items-center gap-2"
              >
                <span className="truncate text-[11px] text-muted-foreground">
                  {labelFor(key)}
                </span>
                <input
                  value={toText(value)}
                  onChange={(e) => setCustom(key, e.target.value)}
                  className={cellClass}
                  aria-label={labelFor(key)}
                />
              </div>
            ))
          : null}
      </div>

      {items ? (
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
            Line items
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-xs">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c}
                      className="pb-1 pr-2 text-left text-[11px] font-normal text-muted-foreground"
                    >
                      {labelFor(c)}
                    </th>
                  ))}
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c} className="py-0.5 pr-2 align-middle">
                        <input
                          value={toText(item[c])}
                          onChange={(e) => setItem(i, c, e.target.value)}
                          className={cellClass}
                          aria-label={`${labelFor(c)} row ${i + 1}`}
                        />
                      </td>
                    ))}
                    <td className="py-0.5 align-middle">
                      <button
                        aria-label={`Delete row ${i + 1}`}
                        onClick={() => removeItem(i)}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={addItem}
            className="mt-2 inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <Plus className="size-3" /> Add row
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Editable review table for extracted invoice records. */
export function InvoiceEditor({
  records,
  onChange,
}: {
  records: Row[];
  onChange: (next: Row[]) => void;
}) {
  return (
    <div className="space-y-2">
      {records.map((record, i) => (
        <RecordCard
          key={i}
          record={record}
          index={i}
          total={records.length}
          onChange={(next) => onChange(records.map((r, j) => (j === i ? next : r)))}
        />
      ))}
    </div>
  );
}
