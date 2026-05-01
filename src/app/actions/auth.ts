"use server";

import { redirect } from "next/navigation";

import { isMockMode } from "@/lib/env";
import { getRoleHomePath, normalizeAppRole } from "@/lib/permissions";
import { isServerSupabaseConfigured } from "@/lib/server-env";
import { clearMockRole, setMockRole } from "@/lib/session";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

export interface SignInActionState {
  error: string | null;
  attemptId: number;
}

function getRoleFromFormData(formData: FormData): AppRole | null {
  return normalizeAppRole(String(formData.get("role") ?? ""));
}

function buildSignInState(error: string): SignInActionState {
  return {
    error,
    attemptId: Date.now(),
  };
}

function logAuthError(message: string, details?: Record<string, unknown>) {
  console.error(`[auth] ${message}`, details ?? {});
}

async function safeSignOut(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
) {
  const { error } = await supabase.auth.signOut();

  if (error) {
    logAuthError("Falha ao limpar a sessão após erro de login.", {
      message: error.message,
      status: error.status,
      name: error.name,
    });
  }
}

async function authUserExistsByEmail(email: string) {
  const serviceClient = createSupabaseServiceRoleClient();

  if (!serviceClient) {
    return null;
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    for (let page = 1; page <= 10; page += 1) {
      const { data, error } = await serviceClient.auth.admin.listUsers({
        page,
        perPage: 200,
      });

      if (error) {
        logAuthError("Falha ao consultar usuários do Auth para depuração de login.", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        return null;
      }

      const users = data?.users ?? [];

      if (users.some((user) => user.email?.toLowerCase() === normalizedEmail)) {
        return true;
      }

      if (users.length < 200) {
        return false;
      }
    }
  } catch (error) {
    logAuthError("Erro inesperado ao verificar existência do usuário no Auth.", {
      error,
      email,
    });
  }

  return null;
}

async function getFriendlyLoginErrorMessage(error: {
  message?: string;
  status?: number;
  code?: string;
  name?: string;
}, email: string) {
  const normalizedMessage = error.message?.toLowerCase() ?? "";

  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("invalid_credentials") ||
    normalizedMessage.includes("invalid grant")
  ) {
    const userExists = await authUserExistsByEmail(email);

    if (userExists === false) {
      return "Usuário não encontrado.";
    }

    return "E-mail ou senha incorretos.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
  }

  if (normalizedMessage.includes("too many requests") || error.status === 429) {
    return "Muitas tentativas de acesso. Aguarde um momento e tente novamente.";
  }

  return "Não foi possível realizar o login no momento. Tente novamente.";
}

export async function signInAction(
  _previousState: SignInActionState,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return buildSignInState("Informe seu e-mail e sua senha.");
  }

  if (!isServerSupabaseConfigured()) {
    logAuthError("Tentativa de login sem configuração pública do Supabase.");
    return buildSignInState(
      "Configuração de acesso não encontrada. Verifique as variáveis de ambiente.",
    );
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    logAuthError("Cliente do Supabase não foi criado durante o login.");
    return buildSignInState(
      "Configuração de acesso não encontrada. Verifique as variáveis de ambiente.",
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    logAuthError("Supabase Auth recusou a tentativa de login.", {
      email,
      message: error.message,
      status: error.status,
      name: error.name,
    });

    return buildSignInState(await getFriendlyLoginErrorMessage(error, email));
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    logAuthError("Usuário autenticado, mas a sessão não pôde ser confirmada.", {
      email,
      message: userError?.message ?? null,
      status: userError?.status ?? null,
      name: userError?.name ?? null,
    });
    await safeSignOut(supabase);
    return buildSignInState("Não foi possível realizar o login no momento. Tente novamente.");
  }

  const { data: rawProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, user_id, name, role, discord_name, discord_id, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    logAuthError("Falha ao buscar o perfil após autenticação.", {
      userId: user.id,
      email: user.email ?? email,
      message: profileError.message,
      code: profileError.code,
    });
    await safeSignOut(supabase);
    return buildSignInState("Não foi possível realizar o login no momento. Tente novamente.");
  }

  if (!rawProfile) {
    await safeSignOut(supabase);
    return buildSignInState("Seu acesso ainda não foi configurado pela equipe.");
  }

  const role = normalizeAppRole(
    typeof rawProfile.role === "string" ? rawProfile.role : null,
  );

  if (!role) {
    logAuthError("Perfil encontrado com papel inválido ou vazio.", {
      userId: user.id,
      email: user.email ?? email,
      profileId: rawProfile.id,
      role: rawProfile.role,
    });
    await safeSignOut(supabase);
    return buildSignInState("Você não tem permissão para acessar esta área.");
  }

  if (role === "creator") {
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id")
      .eq("profile_id", rawProfile.id)
      .maybeSingle();

    if (creatorError) {
      logAuthError("Falha ao validar o cadastro de creator após login.", {
        userId: user.id,
        email: user.email ?? email,
        profileId: rawProfile.id,
        message: creatorError.message,
        code: creatorError.code,
      });
      await safeSignOut(supabase);
      return buildSignInState("Não foi possível realizar o login no momento. Tente novamente.");
    }

    if (!creator) {
      await safeSignOut(supabase);
      return buildSignInState("Seu acesso ainda não foi configurado pela equipe.");
    }
  }

  redirect(getRoleHomePath(role));
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
  redirect(getRoleHomePath(role));
}
