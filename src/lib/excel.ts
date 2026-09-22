import * as XLSX from "xlsx";

export type Row = Record<string, unknown>;

export function parseRecords(text: string): Row[] | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    const list = Array.isArray(parsed) ? parsed : [parsed];
    const rows = list.filter(
      (r): r is Row => !!r && typeof r === "object" && !Array.isArray(r),
    );
    return rows.length ? rows : null;
  } catch {
    return null;
  }
}

const headerFor = (key: string) =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bGst\b/g, "GST")
    .replace(/\bCgst\b/g, "CGST")
    .replace(/\bSgst\b/g, "SGST")
    .replace(/\bIgst\b/g, "IGST")
    .replace(/\bPo\b/g, "PO")
    .replace(/\bId\b/g, "ID");

const flat = (value: unknown): string | number | boolean | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  return String(value);
};

const isObj = (v: unknown): v is Row =>
  !!v && typeof v === "object" && !Array.isArray(v);

/** Flatten one invoice record: drop line_items, spread custom_fields. */
function flatFields(record: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(record)) {
    if (k === "line_items") continue;
    if (k === "custom_fields") {
      if (isObj(v)) for (const [ck, cv] of Object.entries(v)) out[ck] = cv;
      continue;
    }
    out[k] = v;
  }
  return out;
}

function refFor(record: Row, index: number): string {
  const invoice = flat(record["invoice_number"]);
  if (invoice) return String(invoice);
  const vendor = flat(record["vendor_name"]);
  const date = flat(record["invoice_date"]);
  const label = [vendor, date].filter(Boolean).join(" · ");
  return label || `Invoice ${index + 1}`;
}

function lineItemsOf(record: Row): Row[] {
  const items = record["line_items"];
  if (!Array.isArray(items)) return [];
  return items.filter(isObj);
}

function sheetFrom(rows: Row[]) {
  const keys: string[] = [];
  for (const r of rows) {
    for (const k of Object.keys(r)) if (!keys.includes(k)) keys.push(k);
  }
  const headers = keys.map(headerFor);
  const data = rows.map((r) =>
    Object.fromEntries(keys.map((k) => [headerFor(k), flat(r[k])])),
  );
  const sheet = XLSX.utils.json_to_sheet(data, { header: headers });
  sheet["!cols"] = keys.map((k, i) => {
    const widest = Math.max(
      headers[i]!.length,
      ...rows.map((r) => String(flat(r[k]) ?? "").length),
    );
    return { wch: Math.min(48, Math.max(12, widest + 2)) };
  });
  return sheet;
}

export function downloadExcel(records: Row[], filePrefix = "zettafry-invoice") {
  if (!records.length) return;

  const invoiceRows = records.map(flatFields).filter((r) => Object.keys(r).length);

  const itemRows: Row[] = [];
  records.forEach((record, i) => {
    const items = lineItemsOf(record);
    if (!items.length) return;
    const ref = refFor(record, i);
    for (const item of items) {
      itemRows.push({ invoice_ref: ref, ...item });
    }
  });

  const book = XLSX.utils.book_new();
  if (invoiceRows.length) {
    XLSX.utils.book_append_sheet(book, sheetFrom(invoiceRows), "Invoices");
  }
  if (itemRows.length) {
    XLSX.utils.book_append_sheet(book, sheetFrom(itemRows), "Line Items");
  }
  if (!book.SheetNames.length) return;

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(book, `${filePrefix}-${date}.xlsx`);
}
