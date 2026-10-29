import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Temporary sign-in diagnostics. Off unless AUTH_DIAGNOSTICS=on is set in the
 * environment. Reports only whether each Supabase variable is present, its
 * length and what Supabase answers to a sign-in that cannot succeed. Never values.
 */
export async function GET() {
  if (process.env.AUTH_DIAGNOSTICS !== "on")
    return new NextResponse(null, { status: 404 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const shape = (value: string) => ({
    present: !!value,
    length: value.length,
    hasSpaceOrQuote: /[\s"']/.test(value),
  });
  let probe: Record<string, unknown> = {};
  try {
    const { error } = await createClient(url, anon, {
      auth: { persistSession: false },
    }).auth.signInWithPassword({
      email: "auth-check@invalid.example",
      password: "not-a-real-password",
    });
    // "invalid_credentials" means URL and anon key are right; anything else is the fault.
    probe = {
      status: error?.status ?? null,
      code: error?.code ?? null,
      message: error?.message ?? null,
    };
  } catch (error) {
    probe = { thrown: error instanceof Error ? error.message : "unknown" };
  }
  return NextResponse.json({
    url: { ...shape(url), host: url.replace(/^https?:\/\//, "").split(".")[0] },
    anonKey: shape(anon),
    serviceKey: shape(service),
    probe,
  });
}
