import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getServerEnvValue, isServerServiceRoleConfigured, isServerSupabaseConfigured } from "@/lib/server-env";

export async function createSupabaseServerClient() {
  const supabaseUrl = getServerEnvValue("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = getServerEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!isServerSupabaseConfigured() || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignored when called from a Server Component during render.
          }
        },
      },
    },
  );
}

export function createSupabaseServiceRoleClient() {
  const supabaseUrl = getServerEnvValue("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getServerEnvValue("SUPABASE_SERVICE_ROLE_KEY");

  if (
    !isServerSupabaseConfigured() ||
    !isServerServiceRoleConfigured() ||
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    return null;
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
