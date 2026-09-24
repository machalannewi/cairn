export type DocKind = "pdf" | "docx" | "sheet" | "csv" | "markdown" | "text";

export interface DocRecord {
  id: string;
  name: string;
  kind: DocKind;
  size: number;
  /** Short label shown in the library, e.g. "Meeting notes" */
  category: DocCategory;
  uploadedAt: string;
  chunkCount: number;
  wordCount: number;
  /** First ~400 chars, used for previews */
  excerpt: string;
  /** Set for spreadsheets: sheet names and a small table preview */
  sheets?: { name: string; columns: string[]; rows: string[][]; rowCount: number }[];
  sample?: boolean;
}

export type DocCategory = "Report" | "Spreadsheet" | "Meeting notes" | "Memo" | "Other";

export interface Chunk {
  id: string;
  docId: string;
  /** Position within the doc, starting at 0 */
  index: number;
  /** Human location label, e.g. "p. 3", "Sheet: Pricing · rows 1–20", "§ Market size" */
  location: string;
  text: string;
}

export type ResearchMode = "ask" | "compare" | "brief";

/** A passage the model was allowed to cite, numbered from 1 */
export interface Source {
  n: number;
  chunkId: string;
  docId: string;
  docName: string;
  location: string;
  text: string;
  score: number;
}

export interface AskResult {
  answer: string;
  keyPoints: string[];
  confidence: "high" | "medium" | "low";
  gaps: string[];
  followUps: string[];
}

export interface CompareResult {
  summary: string;
  subjects: string[];
  rows: { dimension: string; cells: { value: string; citations: number[] }[] }[];
  takeaway: string;
}

export interface BriefResult {
  decision: string;
  recommendation: string;
  verdict: "go" | "no-go" | "conditional";
  context: string;
  options: { name: string; summary: string; pros: string[]; cons: string[] }[];
  evidence: { claim: string; citations: number[] }[];
  risks: { risk: string; severity: "high" | "medium" | "low"; mitigation: string }[];
  nextSteps: string[];
}

export type ResearchResult =
  | { mode: "ask"; data: AskResult }
  | { mode: "compare"; data: CompareResult }
  | { mode: "brief"; data: BriefResult };

export interface ResearchRecord {
  id: string;
  title: string;
  question: string;
  mode: ResearchMode;
  createdAt: string;
  /** Document scope; empty means the whole library */
  docIds: string[];
  /** For compare: the subjects to compare */
  subjects?: string[];
  result: ResearchResult;
  sources: Source[];
  engine: "claude" | "extractive";
  model?: string;
  durationMs: number;
  saved: boolean;
  shareToken?: string;
  notes?: string;
}

export interface Database {
  version: 1;
  workspace: { name: string; focus: string; createdAt: string };
  docs: DocRecord[];
  chunks: Chunk[];
  research: ResearchRecord[];
}
