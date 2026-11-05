import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const hostnameOf = (value: string | null) => value?.split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";

export const proxy = async (request: NextRequest) => {
  const host = hostnameOf(request.headers.get("host"));
  const forwardedHost = hostnameOf(request.headers.get("x-forwarded-host"));

  if (host === "www.blueoak.cloud" || forwardedHost === "www.blueoak.cloud") {
    const target = new URL(request.nextUrl.pathname + request.nextUrl.search, "https://www.bindushreebiomedicals.com");
    return NextResponse.redirect(target, 301);
  }

  return updateSession(request);
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
