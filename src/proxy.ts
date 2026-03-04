import { NextResponse, type NextRequest } from "next/server";

import { WORKSPACE_COOKIE_NAME } from "@/lib/workspace/workspace";

function generateWorkspaceId() {
  return crypto.randomUUID().replace(/-/g, "");
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const hasWorkspace = request.cookies.has(WORKSPACE_COOKIE_NAME);
  if (hasWorkspace) return response;

  response.cookies.set({
    name: WORKSPACE_COOKIE_NAME,
    value: generateWorkspaceId(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
