"use client";

import { useActionState, useState } from "react";

import { signInAction } from "@/app/actions/auth";

const INITIAL_LOGIN_STATE = {
  error: null,
  attemptId: 0,
};

export function LoginForm({ initialError }: { initialError?: string | null }) {
  const [state, action, pending] = useActionState(signInAction, {
    ...INITIAL_LOGIN_STATE,
    error: initialError ?? null,
  });
  const [dismissedAttemptId, setDismissedAttemptId] = useState<number | null>(null);

  const visibleError =
    state.error && dismissedAttemptId !== state.attemptId ? state.error : null;

  function clearError() {
    if (state.error) {
      setDismissedAttemptId(state.attemptId);
    }
  }

  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-2 text-sm font-medium text-[var(--white)]">
        <span>E-mail</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seuemail@coliseurp.br"
          className="field-input"
          onChange={clearError}
        />
      </label>

      <label className="block space-y-2 text-sm font-medium text-[var(--white)]">
        <span>Senha</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Digite sua senha"
          className="field-input"
          onChange={clearError}
        />
      </label>

      {visibleError ? (
        <div
          aria-live="polite"
          className="rounded-2xl border border-[rgba(139,30,30,0.45)] bg-[rgba(139,30,30,0.2)] px-4 py-3 text-sm text-[#ffd0d0]"
        >
          {visibleError}
        </div>
      ) : null}

      <button type="submit" className="button-gold mt-2 w-full sm:w-auto" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
