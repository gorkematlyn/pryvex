import { NextResponse } from "next/server";
import { consumeAuthToken, markEmailVerified } from "@/lib/repo/users";
import { createSessionCookie } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  if (token) {
    const userId = await consumeAuthToken(token, "email_verify");
    if (userId) {
      await markEmailVerified(userId);
      await createSessionCookie(userId);
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=verify`);
}
