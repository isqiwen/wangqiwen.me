import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

function resolveSafe(inputPath: string) {
  const root = process.cwd();
  const resolved = path.resolve(root, inputPath);
  if (!resolved.startsWith(root)) {
    throw new Error("Invalid path");
  }
  return resolved;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ error: "path is required" }, { status: 400, headers: NO_STORE });
  }

  try {
    const absolute = resolveSafe(filePath);
    const content = await fs.readFile(absolute, "utf8");
    return NextResponse.json({ content }, { headers: NO_STORE });
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json({ error: "failed to read file" }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(req: Request) {
  try {
    const { path: filePath, content } = await req.json();

    if (!filePath || typeof content !== "string") {
      return NextResponse.json(
        { error: "path and content are required" },
        { status: 400, headers: NO_STORE },
      );
    }

    const absolute = resolveSafe(filePath);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, content, "utf8");

    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: "failed to save file" }, { status: 500, headers: NO_STORE });
  }
}
