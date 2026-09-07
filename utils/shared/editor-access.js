/**
 * Defense in depth for the unauthenticated, loopback-only authoring server.
 * This is not authentication: do not expose `next dev` through a proxy or tunnel
 * accessible to other users. Never use forwarded headers as proof of locality.
 */
const LOOPBACK_AUTHORITY = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/i;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getEditorRequestError(request) {
  let target;
  try {
    target = new URL(request.url);
  } catch {
    return "Invalid editor request URL.";
  }

  const authority = request.headers.get("host") || target.host;
  if (!LOOPBACK_AUTHORITY.test(authority)) {
    return "The editor is only available through a loopback address.";
  }

  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return "Cross-site editor requests are not allowed.";
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return SAFE_METHODS.has(request.method.toUpperCase())
      ? null
      : "Editor mutations require a same-origin request.";
  }

  try {
    const expected = new URL(`${target.protocol}//${authority}`).origin;
    const parsed = new URL(origin);
    if (parsed.origin !== expected || parsed.origin !== origin) {
      return "Editor requests must use the same origin.";
    }
  } catch {
    return "Invalid editor request origin.";
  }

  return null;
}

module.exports = { getEditorRequestError };
