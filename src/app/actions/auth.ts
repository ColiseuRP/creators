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
    redirect("/login?error=Informe%20email%20e%20senha");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login?error=Acesso%20indisponivel%20no%20momento");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=Nao%20foi%20possivel%20entrar%20com%20esse%20acesso");
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
    redirect("/login?error=Perfil%20de%20demonstracao%20invalido");
  }

  await setMockRole(role);
  redirect("/dashboard");
}
