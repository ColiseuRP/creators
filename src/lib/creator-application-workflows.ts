import "server-only";

import { revalidatePath } from "next/cache";

import { addDiscordMemberRole, sendDiscordDirectMessage, updateDiscordChannelMessage } from "@/lib/discord-admin";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { CreatorApplicationStatus, SessionContext } from "@/lib/types";
import { getServerEnvValue } from "@/lib/server-env";
import {
  buildCreatorApplicationApprovedDm,
  buildCreatorApplicationRejectedDm,
  buildCreatorApplicationReviewPayload,
} from "@/shared/creator-applications";
import {
  createCreatorApplicationRecord,
  findCreatorApplicationById,
  reviewCreatorApplicationRecord,
  syncApprovedCreatorFromApplication,
} from "@/shared/creator-application-store";
import { createDiscordBotLogRecord } from "@/shared/discord-ticket-store";

interface CreatorApplicationInput {
  name: string;
  discordName: string;
  discordId: string;
  cityName: string;
  age: number;
  category: string;
  twitchUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  instagramUrl?: string;
  frequency: string;
  reason: string;
  contentLinks?: string;
  observations?: string;
}

interface ReviewCreatorApplicationInput {
  applicationId: string;
  decision: Extract<CreatorApplicationStatus, "approved" | "rejected">;
  rejectionReason?: string;
}

export interface ReviewCreatorApplicationResult {
  success: boolean;
  applicationId: string;
  status: Extract<CreatorApplicationStatus, "approved" | "rejected">;
  message: string;
  warnings: string[];
}

async function getApplicationWriteClient() {
  const serviceClient = createSupabaseServiceRoleClient();

  if (serviceClient) {
    return serviceClient;
  }

  return createSupabaseServerClient();
}

async function registerApplicationLog(input: {
  type: string;
  status: "success" | "failed" | "info";
  applicationId: string;
  actionBy?: string | null;
  discordUserId?: string | null;
  discordUsername?: string | null;
  channelId?: string | null;
  message: string;
  errorMessage?: string | null;
}) {
  try {
    await createDiscordBotLogRecord(createSupabaseServiceRoleClient(), {
      type: input.type,
      applicationId: input.applicationId,
      actionBy: input.actionBy ?? null,
      discordUserId: input.discordUserId ?? null,
      discordUsername: input.discordUsername ?? null,
      channelId: input.channelId ?? null,
      status: input.status,
      message: input.message,
      errorMessage: input.errorMessage ?? null,
    });
  } catch (error) {
    console.error("[creator-applications] Falha ao registrar log da inscrição.", error);
  }
}

async function refreshApplicationSurfaces() {
  revalidatePath("/applications");
  revalidatePath("/dashboard");
  revalidatePath("/central/creators");
  revalidatePath("/room");
  revalidatePath("/settings/discord");
}

async function syncReviewMessageToDiscord(
  application: Awaited<ReturnType<typeof findCreatorApplicationById>>,
  reviewedByLabel: string,
) {
  if (!application?.review_channel_id || !application.review_message_id) {
    return;
  }

  const payload = buildCreatorApplicationReviewPayload({
    application,
    status: application.status,
    reviewedByLabel,
    rejectionReason: application.rejection_reason ?? null,
    disableActions: true,
  });

  const result = await updateDiscordChannelMessage(
    application.review_channel_id,
    application.review_message_id,
    payload,
  );

  if (!result.success) {
    console.error("[creator-applications] Falha ao atualizar mensagem de revisão no Discord.", {
      applicationId: application.id,
      error: result.errorMessage,
    });
  }
}

function buildApprovalBaseMessage(decision: ReviewCreatorApplicationInput["decision"]) {
  return decision === "approved"
    ? "Inscrição aprovada com sucesso."
    : "Inscrição negada com sucesso.";
}

export async function submitCreatorApplication(payload: CreatorApplicationInput) {
  if (!createSupabaseServiceRoleClient() && !(await createSupabaseServerClient())) {
    return {
      status: "submitted",
      mode: "mock" as const,
    };
  }

  const supabase = await getApplicationWriteClient();

  if (!supabase) {
    throw new Error("Não foi possível receber sua inscrição agora.");
  }

  await createCreatorApplicationRecord(supabase, {
    name: payload.name,
    discordName: payload.discordName,
    discordId: payload.discordId,
    cityName: payload.cityName,
    age: payload.age,
    category: payload.category,
    twitchUrl: payload.twitchUrl || null,
    tiktokUrl: payload.tiktokUrl || null,
    youtubeUrl: payload.youtubeUrl || null,
    instagramUrl: payload.instagramUrl || null,
    frequency: payload.frequency,
    reason: payload.reason,
    contentLinks: payload.contentLinks || null,
    observations: payload.observations || null,
    source: "site",
  });

  revalidatePath("/inscricao");
  revalidatePath("/applications");

  return {
    status: "submitted",
    mode: "live" as const,
  };
}

export async function reviewCreatorApplication(
  actor: SessionContext,
  input: ReviewCreatorApplicationInput,
): Promise<ReviewCreatorApplicationResult> {
  if (!actor.profile) {
    throw new Error("Perfil não encontrado.");
  }

  if (actor.mockMode) {
    return {
      success: true,
      applicationId: input.applicationId,
      status: input.decision,
      message: buildApprovalBaseMessage(input.decision),
      warnings: ["Demonstração ativa: nenhuma alteração foi salva."],
    };
  }

  const supabase = await getApplicationWriteClient();

  if (!supabase) {
    throw new Error("A configuração interna ainda não está pronta para esta ação.");
  }

  const application = await findCreatorApplicationById(supabase, input.applicationId, {
    fallbackToMemory: false,
  });

  if (!application) {
    throw new Error("Inscrição não encontrada.");
  }

  if (application.status !== "pending") {
    throw new Error("Esta inscrição já foi analisada.");
  }

  if (input.decision === "rejected" && !input.rejectionReason?.trim()) {
    throw new Error("Informe o motivo da negação.");
  }

  const updatedApplication = await reviewCreatorApplicationRecord(supabase, {
    applicationId: input.applicationId,
    decision: input.decision,
    reviewedBy: actor.profile.id,
    reviewedByName: actor.profile.name,
    rejectionReason: input.decision === "rejected" ? input.rejectionReason?.trim() : null,
  });

  if (!updatedApplication) {
    throw new Error("Inscrição não encontrada.");
  }

  await registerApplicationLog({
    type:
      input.decision === "approved"
        ? "creator_application_approved"
        : "creator_application_rejected",
    status: "success",
    applicationId: updatedApplication.id,
    actionBy: actor.profile.id,
    discordUserId: updatedApplication.discord_id,
    discordUsername: updatedApplication.discord_name,
    channelId: updatedApplication.review_channel_id ?? null,
    message:
      input.decision === "approved"
        ? `Inscrição aprovada por ${actor.profile.name}.`
        : `Inscrição negada por ${actor.profile.name}.`,
  });

  const warnings: string[] = [];
  const ticketChannelId =
    getServerEnvValue("DISCORD_TICKET_CHANNEL_ID") ?? "1447948746670477469";

  if (input.decision === "approved") {
    const creatorSync = await syncApprovedCreatorFromApplication(supabase, updatedApplication);

    if (creatorSync.skipped && creatorSync.reason) {
      warnings.push(
        "Inscrição aprovada, mas ainda não foi possível liberar a Sala do Creator automaticamente.",
      );
    }
  }

  if (!updatedApplication.discord_id?.trim()) {
    const missingDiscordWarning =
      "Inscrição atualizada, mas não foi possível enviar mensagem privada porque o Discord ID não está cadastrado.";

    warnings.push(missingDiscordWarning);

    await registerApplicationLog({
      type: "creator_application_dm_failed",
      status: "failed",
      applicationId: updatedApplication.id,
      actionBy: actor.profile.id,
      discordUsername: updatedApplication.discord_name,
      message: "A inscrição foi atualizada, mas não havia Discord ID para enviar DM.",
      errorMessage: "Discord ID não cadastrado.",
    });
  } else {
    const dmContent =
      input.decision === "approved"
        ? buildCreatorApplicationApprovedDm(updatedApplication.name, ticketChannelId)
        : buildCreatorApplicationRejectedDm(
            updatedApplication.name,
            updatedApplication.rejection_reason ?? "Não informado pela equipe.",
          );

    const dmResult = await sendDiscordDirectMessage(
      updatedApplication.discord_id,
      dmContent,
    );

    if (!dmResult.success) {
      warnings.push(
        "Inscrição atualizada, mas não foi possível enviar a mensagem privada no Discord.",
      );

      await registerApplicationLog({
        type: "creator_application_dm_failed",
        status: "failed",
        applicationId: updatedApplication.id,
        actionBy: actor.profile.id,
        discordUserId: updatedApplication.discord_id,
        discordUsername: updatedApplication.discord_name,
        channelId: dmResult.channelId,
        message: "A inscrição foi atualizada, mas a DM não pôde ser enviada.",
        errorMessage: dmResult.errorMessage,
      });
    } else {
      await registerApplicationLog({
        type: "creator_application_dm_sent",
        status: "success",
        applicationId: updatedApplication.id,
        actionBy: actor.profile.id,
        discordUserId: updatedApplication.discord_id,
        discordUsername: updatedApplication.discord_name,
        channelId: dmResult.channelId,
        message: "Mensagem privada enviada com sucesso ao creator.",
      });
    }
  }

  if (input.decision === "approved" && updatedApplication.discord_id?.trim()) {
    const approvedRoleId = getServerEnvValue("DISCORD_APPROVED_CREATOR_ROLE_ID");

    if (!approvedRoleId) {
      warnings.push(
        "Inscrição aprovada, mas o cargo aprovado creator ainda não está configurado.",
      );

      await registerApplicationLog({
        type: "creator_application_role_failed",
        status: "failed",
        applicationId: updatedApplication.id,
        actionBy: actor.profile.id,
        discordUserId: updatedApplication.discord_id,
        discordUsername: updatedApplication.discord_name,
        message: "A inscrição foi aprovada, mas o cargo aprovado creator não está configurado.",
        errorMessage: "DISCORD_APPROVED_CREATOR_ROLE_ID ausente.",
      });
    } else {
      const roleResult = await addDiscordMemberRole(
        updatedApplication.discord_id,
        approvedRoleId,
      );

      if (!roleResult.success) {
        warnings.push(
          "A inscrição foi aprovada, mas não foi possível adicionar o cargo automaticamente.",
        );

        await registerApplicationLog({
          type: "creator_application_role_failed",
          status: "failed",
          applicationId: updatedApplication.id,
          actionBy: actor.profile.id,
          discordUserId: updatedApplication.discord_id,
          discordUsername: updatedApplication.discord_name,
          message: "A inscrição foi aprovada, mas houve falha ao adicionar o cargo.",
          errorMessage: roleResult.errorMessage,
        });
      } else {
        await registerApplicationLog({
          type: "creator_application_role_added",
          status: "success",
          applicationId: updatedApplication.id,
          actionBy: actor.profile.id,
          discordUserId: updatedApplication.discord_id,
          discordUsername: updatedApplication.discord_name,
          message: "Cargo de creator aprovado adicionado com sucesso.",
        });
      }
    }
  }

  await syncReviewMessageToDiscord(updatedApplication, actor.profile.name);
  await refreshApplicationSurfaces();

  return {
    success: true,
    applicationId: updatedApplication.id,
    status: input.decision,
    message: buildApprovalBaseMessage(input.decision),
    warnings,
  };
}
