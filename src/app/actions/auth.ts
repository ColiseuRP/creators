"use server";

import { redirect } from "next/navigation";

import { isMockMode } from "@/lib/env";
import { clearMockRole, setMockRole } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

function getRoleFromFormData(formData: FormData): AppRole | null {
  const role = formData.get("role");

  if (
    role === "admin_general" ||
    role === "responsavel_creators" ||
    role === "creator"
  ) {
    return role;
  }

  return null;
}

export async function signInAction(formData: FormData) {
  if (isMockMode) {
    const role = getRoleFromFormData(formData) ?? "admin_general";
    await setMockRole(role);
    redirect("/dashboard");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Informe%20e-mail%20e%20senha.");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login?error=Acesso%20indispon%C3%ADvel%20no%20momento.");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=N%C3%A3o%20foi%20poss%C3%ADvel%20entrar%20com%20esse%20acesso.");
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  if (isMockMode) {
    await clearMockRole();
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login");
}

export async function switchDemoRoleAction(formData: FormData) {
  if (!isMockMode) {
    redirect("/dashboard");
  }

  const role = getRoleFromFormData(formData);

  if (!role) {
    redirect("/login?error=Perfil%20de%20demonstra%C3%A7%C3%A3o%20inv%C3%A1lido.");
  }

  await setMockRole(role);
  redirect("/dashboard");
}
