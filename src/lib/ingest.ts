import "server-only";
import path from "node:path";
import { nanoid } from "nanoid";
import * as XLSX from "xlsx";
import { deleteDocument, deleteSamples, insertDocument } from "./store";
import type { Actor, Chunk, DocCategory, DocKind, DocRecord } from "./types";

export const ACCEPTED = [".pdf", ".docx", ".xlsx", ".xls", ".csv", ".md", ".markdown", ".txt"];
export const MAX_BYTES = 20 * 1024 * 1024;

type Section = { location: string; text: string };
type Parsed = { kind: DocKind; sections: Section[]; sheets?: DocRecord["sheets"] };

function kindFor(name: string): DocKind | null {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".pdf") return "pdf";
  if (ext === ".docx") return "docx";
  if (ext === ".xlsx" || ext === ".xls") return "sheet";
  if (ext === ".csv") return "csv";
  if (ext === ".md" || ext === ".markdown") return "markdown";
  if (ext === ".txt") return "text";
  return null;
}

/** Split prose by markdown-style headings so citations can point at a section. */
function sectionsFromProse(text: string, fallback = "Body"): Section[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: Section[] = [];
  let heading = fallback;
  let buf: string[] = [];
  const flush = () => {
    const t = buf.join("\n").trim();
    if (t) out.push({ location: heading === fallback ? fallback : `§ ${heading}`, text: t });
    buf = [];
  };
  for (const line of lines) {
    const m = /^#{1,4}\s+(.+)$/.exec(line.trim());
    if (m) {
      flush();
      heading = m[1].replace(/[*_`]/g, "").trim();
    } else buf.push(line);
  }
  flush();
  return out;
}

function sheetSections(wb: XLSX.WorkBook): Pick<Parsed, "sections" | "sheets"> {
  const sections: Section[] = [];
  const sheets: NonNullable<DocRecord["sheets"]> = [];
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], {
      header: 1,
      blankrows: false,
      defval: "",
      raw: false,
    }) as unknown[][];
    if (!rows.length) continue;
    const columns = rows[0].map((c, i) => String(c || `Column ${i + 1}`).trim());
    const body = rows.slice(1).map((r) => columns.map((_, i) => String(r[i] ?? "").trim()));
    sheets.push({ name, columns, rows: body.slice(0, 12), rowCount: body.length });
    // Each row becomes a "col: value" line so keyword search and the model both see headers.
    const PER = 15;
    for (let i = 0; i < body.length; i += PER) {
      const slice = body.slice(i, i + PER);
      const text = slice
        .map((r) => r.map((v, c) => (v ? `${columns[c]}: ${v}` : "")).filter(Boolean).join(" | "))
        .join("\n");
      const label = wb.SheetNames.length > 1 ? `Sheet “${name}” · ` : "";
      sections.push({ location: `${label}rows ${i + 1}–${i + slice.length}`, text });
    }
  }
  return { sections, sheets };
}

async function parse(name: string, buf: Buffer): Promise<Parsed> {
  const kind = kindFor(name);
  if (!kind) throw new Error(`Unsupported file type. Use ${ACCEPTED.join(", ")}`);

  if (kind === "pdf") {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: false });
    const pages = Array.isArray(text) ? text : [text];
    return {
      kind,
      sections: pages
        .map((t, i) => ({ location: `p. ${i + 1}`, text: t.replace(/\s+\n/g, "\n").trim() }))
        .filter((s) => s.text),
    };
  }
  if (kind === "docx") {
    const mammoth = await import("mammoth");
    // Convert to markdown-ish text so headings survive for section labels.
    const { value: html } = await mammoth.convertToHtml({ buffer: buf });
    const text = html
      .replace(/<h[1-4][^>]*>(.*?)<\/h[1-4]>/g, "\n## $1\n")
      .replace(/<\/(p|li|tr)>/g, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/[ \t]+/g, " ");
    return { kind, sections: sectionsFromProse(text) };
  }
  if (kind === "sheet" || kind === "csv") {
    const wb =
      kind === "csv"
        ? XLSX.read(buf.toString("utf8"), { type: "string" })
        : XLSX.read(buf, { type: "buffer" });
    return { kind, ...sheetSections(wb) };
  }
  return { kind, sections: sectionsFromProse(buf.toString("utf8")) };
}

/** Pack sections into ~900 char chunks on paragraph boundaries, keeping location labels. */
function chunk(docId: string, sections: Section[]): Chunk[] {
  const TARGET = 900;
  const out: Chunk[] = [];
  for (const s of sections) {
    const paras = s.text.split(/\n{2,}|\n(?=[-*•]\s)/).map((p) => p.trim()).filter(Boolean);
    let buf = "";
    const push = () => {
      if (buf.trim()) {
        out.push({ id: nanoid(10), docId, index: out.length, location: s.location, text: buf.trim() });
      }
      buf = "";
    };
    for (const p of paras) {
      if (buf && buf.length + p.length > TARGET) push();
      if (p.length > TARGET * 1.6) {
        // Very long paragraph: hard-split on sentences.
        for (const sent of p.split(/(?<=[.!?])\s+/)) {
          if (buf.length + sent.length > TARGET) push();
          buf += (buf ? " " : "") + sent;
        }
      } else buf += (buf ? "\n\n" : "") + p;
    }
    push();
  }
  return out;
}

function categorise(name: string, kind: DocKind, text: string): DocCategory {
  const n = name.toLowerCase();
  if (kind === "sheet" || kind === "csv") return "Spreadsheet";
  if (/meeting|minutes|call|interview|standup|sync|notes/.test(n) || /attendees:|action items/i.test(text))
    return "Meeting notes";
  if (/memo|brief|proposal/.test(n)) return "Memo";
  if (/report|analysis|study|research|market|overview/.test(n) || kind === "pdf") return "Report";
  return "Other";
}

/** Parse + chunk a file. Originals aren't kept — only extracted text is stored. */
export async function ingestFile(
  name: string,
  buf: Buffer,
  opts: { sample?: boolean; by?: Actor } = {},
) {
  if (buf.byteLength > MAX_BYTES) throw new Error("File is larger than 20 MB");
  const parsed = await parse(name, buf);
  const id = nanoid(10);
  const chunks = chunk(id, parsed.sections);
  if (!chunks.length) throw new Error("No readable text found in this file");
  const all = parsed.sections.map((s) => s.text).join("\n\n");


  const doc: DocRecord = {
    id,
    name,
    kind: parsed.kind,
    size: buf.byteLength,
    category: categorise(name, parsed.kind, all),
    uploadedAt: new Date().toISOString(),
    chunkCount: chunks.length,
    wordCount: all.split(/\s+/).filter(Boolean).length,
    excerpt: all.replace(/\s+/g, " ").slice(0, 400),
    sheets: parsed.sheets,
    sample: opts.sample,
    uploadedBy: opts.by,
  };
  return { doc, chunks };
}

export async function addDocument(orgId: string, name: string, buf: Buffer, by: Actor) {
  const { doc, chunks } = await ingestFile(name, buf, { by });
  await insertDocument(orgId, doc, chunks);
  return doc;
}

export const removeDocument = deleteDocument;

/** Admin action: drop the seeded sample documents once a team has its own. */
export const removeSamples = deleteSamples;
