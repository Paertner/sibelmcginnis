import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** True once the Supabase keys are in the environment. */
export const supabaseConfigured = () =>
  !!url() &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Full-access client for the server only. Authorization is checked in our own code. */
export function adminClient() {
  return createClient(url(), process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Client that reads and writes the visitor's sign-in cookies. */
export async function sessionClient() {
  const jar = await cookies();
  return createServerClient(url(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(items) {
        // Server Components cannot set cookies; actions and route handlers can.
        try {
          for (const { name, value, options } of items)
            jar.set(name, value, options);
        } catch {}
      },
    },
  });
}
