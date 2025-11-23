import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import path from "path";

const execAsync = util.promisify(exec);

export async function POST() {
  try {
    const cwd = process.cwd();
    const command = "pnpm sync:posts";
    const { stdout, stderr } = await execAsync(command, { cwd, env: process.env });

    return NextResponse.json({ ok: true, stdout, stderr });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "publish failed", stdout: error?.stdout, stderr: error?.stderr },
      { status: 500 },
    );
  }
}
