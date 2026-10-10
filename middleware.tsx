import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getEditorRequestError } from "@/utils/shared/editor-access";

// The editor is all this guards, and it must import nothing that changes while
// authoring. The development server recompiles the middleware whenever one of
// its imports changes, and a request that arrives meanwhile can be answered
// with an empty 200. Which articles are public is decided by the article
// route itself; see app/(post)/[year]/[slug]/page.tsx.
export const config = {
  matcher: ["/editor/:path*", "/api/editor/:path*"],
};

const NO_STORE = { "Cache-Control": "no-store" };

export function middleware(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404, headers: NO_STORE });
  }

  const error = getEditorRequestError(req);
  if (error) {
    return NextResponse.json({ error }, { status: 403, headers: NO_STORE });
  }

  return NextResponse.next();
}
