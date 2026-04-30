import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getSessionContext } from "@/lib/session";
import type { AppRole } from "@/lib/types";

export function okResponse(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function errorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join("; ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocorreu um erro inesperado.";
}

export function errorResponse(error: unknown, status = 400) {
  return NextResponse.json({ error: errorMessage(error) }, { status });
}

export async function requireApiActor(allowedRoles?: AppRole[]) {
  const actor = await getSessionContext();

  if (!actor.user || !actor.profile) {
    return {
      actor: null,
      response: NextResponse.json({ error: "Sessão inválida." }, { status: 401 }),
    };
  }

  if (allowedRoles?.length && (!actor.role || !allowedRoles.includes(actor.role))) {
    return {
      actor: null,
      response: NextResponse.json({ error: "Acesso negado." }, { status: 403 }),
    };
  }

  return { actor, response: null };
}
