import { NextResponse } from "next/server";
import { ACCEPTED, addDocument } from "@/lib/ingest";
import { readDb } from "@/lib/store";

export async function GET() {
  const db = await readDb();
  return NextResponse.json({ docs: db.docs });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "No files received" }, { status: 400 });

  const results = await Promise.all(
    files.map(async (file) => {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!ACCEPTED.includes(ext)) return { name: file.name, error: `Unsupported type ${ext}` };
      try {
        const doc = await addDocument(file.name, Buffer.from(await file.arrayBuffer()));
        return { name: file.name, doc };
      } catch (e) {
        return { name: file.name, error: e instanceof Error ? e.message : "Could not read file" };
      }
    }),
  );
  return NextResponse.json({ results });
}
