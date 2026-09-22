import type { Attachment } from "./chat-store";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 5;
const MAX_TEXT_CHARS = 20000;

const TEXT_EXT = [
  ".txt",
  ".csv",
  ".json",
  ".md",
  ".xml",
  ".html",
  ".log",
  ".tsv",
  ".yml",
  ".yaml",
];

const isTextName = (name: string) =>
  TEXT_EXT.some((ext) => name.toLowerCase().endsWith(ext));

const isImageName = (name: string) => /\.(png|jpe?g|webp|gif|bmp)$/i.test(name);

const isPdfName = (name: string) => /\.pdf$/i.test(name);

function readAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

const clip = (s: string) =>
  s.length > MAX_TEXT_CHARS ? `${s.slice(0, MAX_TEXT_CHARS)}\n…[truncated]` : s;

/** Renders the first pages of a PDF into image attachments the vision model can read. */
async function pdfToAttachments(
  name: string,
  buffer: ArrayBuffer,
): Promise<Attachment[]> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url"))
    .default as string;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages = Math.min(doc.numPages, MAX_PDF_PAGES);
  const out: Attachment[] = [];

  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(2, 1600 / base.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) break;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    out.push({
      kind: "image",
      name: `${name} · page ${i}`,
      data: canvas.toDataURL("image/jpeg", 0.85),
    });
  }

  if (!out.length) throw new Error("Could not read any page from this PDF");
  if (doc.numPages > pages) {
    out.push({
      kind: "text",
      name: `${name} · note`,
      data: `This PDF has ${doc.numPages} pages; only the first ${pages} were sent.`,
    });
  }
  return out;
}

/** Turns a picked file (image, PDF, text, or .zip) into chat attachments. */
export async function fileToAttachments(file: File): Promise<Attachment[]> {
  const name = file.name;

  if (name.toLowerCase().endsWith(".zip")) {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(file);
    const out: Attachment[] = [];

    const entries = Object.values(zip.files).filter((e) => !e.dir);
    for (const entry of entries) {
      if (out.length >= 8) break;
      if (isImageName(entry.name)) {
        const blob = await entry.async("blob");
        if (blob.size > MAX_IMAGE_BYTES) continue;
        const ext = entry.name.split(".").pop()?.toLowerCase() ?? "png";
        const mime = ext === "jpg" ? "jpeg" : ext;
        const raw = await readAsDataURL(blob);
        out.push({
          kind: "image",
          name: `${name}/${entry.name.split("/").pop()}`,
          data: raw.replace(/^data:[^;]*;/, `data:image/${mime};`),
        });
      } else if (isPdfName(entry.name)) {
        const buf = await entry.async("arraybuffer");
        const pdfs = await pdfToAttachments(
          `${name}/${entry.name.split("/").pop()}`,
          buf,
        );
        out.push(...pdfs);
      } else if (isTextName(entry.name)) {
        out.push({
          kind: "text",
          name: `${name}/${entry.name.split("/").pop()}`,
          data: clip(await entry.async("string")),
        });
      }
    }

    if (out.length === 0) {
      throw new Error("No images, PDFs or readable text files found inside the zip");
    }
    return out;
  }

  if (file.type === "application/pdf" || isPdfName(name)) {
    if (file.size > MAX_PDF_BYTES) {
      throw new Error("PDF is too large — keep it under 10 MB");
    }
    return pdfToAttachments(name, await file.arrayBuffer());
  }

  if (file.type.startsWith("image/") || isImageName(name)) {
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error("Image is too large — keep it under 10 MB");
    }
    return [{ kind: "image", name, data: await readAsDataURL(file) }];
  }

  if (file.type.startsWith("text/") || isTextName(name)) {
    return [{ kind: "text", name, data: clip(await file.text()) }];
  }

  throw new Error(
    "Unsupported file — upload an image, PDF, text/CSV/JSON file, or a .zip",
  );
}
