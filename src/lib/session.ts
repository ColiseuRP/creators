import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getRoleHomePath, isStaffRole, normalizeAppRole } from "@/lib/permissions";
import { DEMO_ROLE_COOKIE, getMockSession } from "@/lib/mock";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole, SessionContext } from "@/lib/types";
import { isMockMode } from "@/lib/env";

export async function getSessionContext(): Promise<SessionContext> {
  if (isMockMode) {
    const cookieStore = await cookies();
    const role = normalizeAppRole(cookieStore.get(DEMO_ROLE_COOKIE)?.value);
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

  const { data: rawProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, user_id, name, discord_name, discord_id, role, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[auth] Falha ao buscar perfil no contexto de sessão.", {
      userId: user.id,
      email: user.email ?? null,
      message: profileError.message,
      code: profileError.code,
    });
  }

  const role = normalizeAppRole(
    rawProfile && typeof rawProfile.role === "string" ? rawProfile.role : null,
  );

  if (rawProfile && !role) {
    console.error("[auth] Perfil autenticado com papel inválido.", {
      userId: user.id,
      email: user.email ?? null,
      profileId: rawProfile.id,
      role: rawProfile.role,
    });
  }

  const profile = rawProfile && role
    ? {
        ...rawProfile,
        role,
        email: user.email ?? null,
      }
    : null;

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
    profile,
    creator,
    role: role ?? null,
    mockMode: false,
    isAdmin: role === "admin_general",
    canManageCreators: isStaffRole(role),
  };
}

export async function requireSession(allowedRoles?: AppRole[]) {
  const actor = await getSessionContext();

  if (!actor.user || !actor.profile) {
    redirect("/login");
  }

  if (allowedRoles?.length && (!actor.role || !allowedRoles.includes(actor.role))) {
    redirect(actor.role ? getRoleHomePath(actor.role) : "/login");
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
