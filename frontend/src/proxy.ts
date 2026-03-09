import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!session && request.nextUrl.pathname.startsWith("/voice")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!session && request.nextUrl.pathname.startsWith("/preview")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/voice/:path*", "/preview/:path*"],
};
