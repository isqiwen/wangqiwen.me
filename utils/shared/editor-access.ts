export const editorAccessCookieName = "editor_access";

const encoder = new TextEncoder();

export async function hashEditorAccessToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return Array.from(new Uint8Array(digest), value =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}
