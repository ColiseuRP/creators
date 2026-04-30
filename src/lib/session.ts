import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isStaffRole } from "@/lib/permissions";
import { DEMO_ROLE_COOKIE, getMockSession } from "@/lib/mock";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole, SessionContext } from "@/lib/types";
import { isMockMode } from "@/lib/env";

function normalizeRole(value: string | undefined): AppRole | null {
  if (
    value === "admin_general" ||
    value === "responsavel_creators" ||
    value === "creator"
  ) {
    return value;
  }

  return null;
}

export async function getSessionContext(): Promise<SessionContext> {
  if (isMockMode) {
    const cookieStore = await cookies();
    const role = normalizeRole(cookieStore.get(DEMO_ROLE_COOKIE)?.value);
    return getMockSession(role);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      user: null,
      profile: null,
      creator: null,
      role: null,
      mockMode: false,
      isAdmin: false,
      canManageCreators: false,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profile: null,
      creator: null,
      role: null,
      mockMode: false,
      isAdmin: false,
      canManageCreators: false,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  let creator = null;

  if (profile?.role === "creator") {
    const { data } = await supabase
      .from("creators")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle();

    creator = data;
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    profile: profile ?? null,
    creator,
    role: profile?.role ?? null,
    mockMode: false,
    isAdmin: profile?.role === "admin_general",
    canManageCreators: isStaffRole(profile?.role),
  };
}

export async function requireSession(allowedRoles?: AppRole[]) {
  const actor = await getSessionContext();

  if (!actor.user || !actor.profile) {
    redirect("/login");
  }

  if (allowedRoles?.length && (!actor.role || !allowedRoles.includes(actor.role))) {
    redirect("/dashboard");
  }

  return actor;
}

export async function setMockRole(role: AppRole) {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearMockRole() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_ROLE_COOKIE);
}
