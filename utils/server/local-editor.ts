import { NextResponse } from "next/server";

const NO_STORE = { "Cache-Control": "no-store" };

function isLocalEditorAvailable(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function requireLocalEditor() {
  if (isLocalEditorAvailable()) {
    return null;
  }

  return NextResponse.json(
    { error: "not found" },
    { status: 404, headers: NO_STORE },
  );
}

export function canPreviewDrafts(): boolean {
  return isLocalEditorAvailable();
}
