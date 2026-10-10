// Runs once when the server starts. Pages are prerendered at build time, so a
// check placed in a layout would never run on the deployed server.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureEnvironmentWarnings } = await import(
      "@/utils/server/env-warnings"
    );
    ensureEnvironmentWarnings();
  }
}
