import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Creator,
  CreatorApplication,
  CreatorApplicationSource,
  CreatorApplicationStatus,
  Profile,
} from "../lib/types";
import { slugify } from "../lib/utils";
import {
  INVALID_CREATOR_APPLICATION_ID_MESSAGE,
  isCreatorApplicationUuid,
} from "./creator-applications";

type DatabaseClient = SupabaseClient | null;

interface StoreReadOptions {
  fallbackToMemory?: boolean;
  statuses?: CreatorApplicationStatus[] | null;
  sources?: CreatorApplicationSource[] | null;
}

interface CreateCreatorApplicationInput {
  name: string;
  discordName: string;
  discordId: string;
  cityName: string;
  age?: number | null;
  category: string;
  twitchUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  instagramUrl?: string | null;
  frequency: string;
  reason: string;
  contentLinks?: string | null;
  observations?: string | null;
  status?: CreatorApplicationStatus;
  source?: CreatorApplicationSource;
}

interface CreateCreatorApplicationOptions {
  fallbackToMemory?: boolean;
}

interface CreateDiscordCreatorApplicationInput {
  name: string;
  discordName: string;
  discordId: string;
  cityName: string;
  category: string;
  frequency: string;
  reason: string;
  contentLinks?: string | null;
  observations?: string | null;
  status?: CreatorApplicationStatus;
  source?: CreatorApplicationSource;
  createdAt?: string;
}

interface ReviewCreatorApplicationInput {
  applicationId: string;
  decision: Extract<CreatorApplicationStatus, "approved" | "rejected">;
  reviewedAt?: string;
  reviewedBy?: string | null;
  reviewedByText?: string | null;
  reviewedByName?: string | null;
  rejectionReason?: string | null;
}

interface UpdateCreatorApplicationReviewMessageInput {
  applicationId: string;
  reviewChannelId?: string | null;
  reviewMessageId?: string | null;
}

interface SyncApprovedCreatorResult {
  creatorId: string | null;
  profileId: string | null;
  created: boolean;
  updated: boolean;
  skipped: boolean;
  reason: string | null;
}

const memoryState: {
  applications: CreatorApplication[];
} = {
  applications: [],
};

function isMissingTableError(
  error: {
    code?: string | null;
    message?: string | null;
    details?: string | null;
    hint?: string | null;
  } | null,
) {
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    error?.message?.includes("relation") ||
    error?.message?.includes("Could not find the table") ||
    error?.message?.includes("schema cache") ||
    error?.message?.includes("does not exist") ||
    error?.details?.includes("schema cache") ||
    error?.hint?.includes("schema cache") ||
    false
  );
}

function isMissingColumnError(
  error: {
    code?: string | null;
    message?: string | null;
    details?: string | null;
    hint?: string | null;
  } | null,
  columnName: string,
) {
  const content = [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();

  return (
    error?.code === "42703" ||
    error?.code === "PGRST204" ||
    (content.includes(columnName.toLowerCase()) &&
      (content.includes("column") || content.includes("schema cache")))
  );
}

function getNowIso() {
  return new Date().toISOString();
}

function createMemoryId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function assertPersistentApplicationId(applicationId: string) {
  if (!isCreatorApplicationUuid(applicationId)) {
    throw new Error(INVALID_CREATOR_APPLICATION_ID_MESSAGE);
  }
}

function normalizeSource(source: CreatorApplicationSource | null | undefined) {
  return source === "discord" ? "discord" : "site";
}

function normalizeApplication(
  application: Partial<CreatorApplication> & Pick<CreatorApplication, "id" | "name">,
) {
  return {
    ...application,
    age: typeof application.age === "number" ? application.age : null,
    source: normalizeSource(application.source),
    status: (application.status ?? "pending") as CreatorApplicationStatus,
    reviewed_by_text: application.reviewed_by_text ?? null,
    reviewed_by_name: application.reviewed_by_name ?? null,
    rejection_reason: application.rejection_reason ?? null,
    review_channel_id: application.review_channel_id ?? null,
    review_message_id: application.review_message_id ?? null,
  } as CreatorApplication;
}

function sortApplicationsByCreatedAt(applications: CreatorApplication[]) {
  return [...applications].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function filterApplications(
  applications: CreatorApplication[],
  options?: StoreReadOptions,
) {
  return applications.filter((application) => {
    const statusMatch =
      !options?.statuses?.length || options.statuses.includes(application.status);
    const sourceMatch =
      !options?.sources?.length ||
      options.sources.includes(normalizeSource(application.source));

    return statusMatch && sourceMatch;
  });
}

function buildRoomTitle(applicationName: string) {
  const [firstName] = applicationName.trim().split(/\s+/);
  return `Sala do ${firstName || "Creator"}`;
}

async function ensureCreatorRoom(
  client: SupabaseClient,
  creatorId: string,
  applicationName: string,
) {
  const { data: existingRoom, error: roomError } = await client
    .from("creator_rooms")
    .select("id")
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (roomError && !isMissingTableError(roomError)) {
    throw new Error(roomError.message);
  }

  if (existingRoom) {
    return;
  }

  const slugBase = slugify(applicationName) || `creator-${creatorId.slice(0, 8)}`;
  const slug = `${slugBase}-${creatorId.slice(0, 6)}`.slice(0, 90);

  const { error: insertRoomError } = await client.from("creator_rooms").insert({
    creator_id: creatorId,
    slug,
    title: buildRoomTitle(applicationName),
    description: "Sala oficial do creator para métricas, avisos e histórico da equipe.",
    is_active: true,
  });

  if (insertRoomError && !isMissingTableError(insertRoomError)) {
    throw new Error(insertRoomError.message);
  }
}

async function findProfileForApplication(
  client: SupabaseClient,
  application: CreatorApplication,
) {
  let profile: Profile | null = null;

  if (application.discord_id) {
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("discord_id", application.discord_id)
      .maybeSingle();

    if (error && !isMissingTableError(error)) {
      throw new Error(error.message);
    }

    profile = (data as Profile | null) ?? null;
  }

  if (!profile && application.discord_name) {
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("discord_name", application.discord_name)
      .maybeSingle();

    if (error && !isMissingTableError(error)) {
      throw new Error(error.message);
    }

    profile = (data as Profile | null) ?? null;
  }

  return profile;
}

export async function listCreatorApplications(
  client: DatabaseClient,
  options?: StoreReadOptions,
) {
  const fallbackToMemory = options?.fallbackToMemory ?? true;

  if (!client) {
    return filterApplications(sortApplicationsByCreatedAt(memoryState.applications), options);
  }

  let query = client
    .from("creator_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.statuses?.length) {
    query = query.in("status", options.statuses);
  }

  if (options?.sources?.length) {
    query = query.in("source", options.sources);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingTableError(error) && fallbackToMemory) {
      return listCreatorApplications(null, options);
    }

    throw new Error(error.message);
  }

  return ((data ?? []) as CreatorApplication[]).map(normalizeApplication);
}

export async function findCreatorApplicationById(
  client: DatabaseClient,
  applicationId: string,
  options?: StoreReadOptions,
) {
  const fallbackToMemory = options?.fallbackToMemory ?? true;

  if (!client) {
    return (
      memoryState.applications.find((application) => application.id === applicationId) ?? null
    );
  }

  assertPersistentApplicationId(applicationId);

  const { data, error } = await client
    .from("creator_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error) && fallbackToMemory) {
      return findCreatorApplicationById(null, applicationId, options);
    }

    throw new Error(error.message);
  }

  return data ? normalizeApplication(data as CreatorApplication) : null;
}

export async function createCreatorApplicationRecord(
  client: DatabaseClient,
  input: CreateCreatorApplicationInput,
  options?: CreateCreatorApplicationOptions,
) {
  const createdAt = getNowIso();
  const fallbackToMemory = options?.fallbackToMemory ?? true;

  if (!client) {
    if (!fallbackToMemory) {
      throw new Error("Não foi possível salvar a inscrição no Supabase.");
    }

    const application = normalizeApplication({
      id: createMemoryId("application"),
      name: input.name,
      discord_name: input.discordName,
      discord_id: input.discordId,
      city_name: input.cityName,
      age: input.age ?? null,
      category: input.category,
      twitch_url: input.twitchUrl ?? null,
      tiktok_url: input.tiktokUrl ?? null,
      youtube_url: input.youtubeUrl ?? null,
      instagram_url: input.instagramUrl ?? null,
      frequency: input.frequency,
      reason: input.reason,
      content_links: input.contentLinks ?? null,
      observations: input.observations ?? null,
      status: input.status ?? "pending",
      created_at: createdAt,
      reviewed_at: null,
      reviewed_by: null,
      source: input.source ?? "site",
    });

    memoryState.applications.unshift(application);
    return application;
  }

  const insertPayload = {
    name: input.name,
    discord_name: input.discordName,
    discord_id: input.discordId,
    city_name: input.cityName,
    age: input.age ?? null,
    category: input.category,
    twitch_url: input.twitchUrl ?? null,
    tiktok_url: input.tiktokUrl ?? null,
    youtube_url: input.youtubeUrl ?? null,
    instagram_url: input.instagramUrl ?? null,
    frequency: input.frequency,
    reason: input.reason,
    content_links: input.contentLinks ?? null,
    observations: input.observations ?? null,
    status: input.status ?? "pending",
    source: input.source ?? "site",
  };

  let { data, error } = await client
    .from("creator_applications")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error && isMissingColumnError(error, "source")) {
    ({ data, error } = await client
      .from("creator_applications")
      .insert({
        name: input.name,
        discord_name: input.discordName,
        discord_id: input.discordId,
        city_name: input.cityName,
        age: input.age ?? null,
        category: input.category,
        twitch_url: input.twitchUrl ?? null,
        tiktok_url: input.tiktokUrl ?? null,
        youtube_url: input.youtubeUrl ?? null,
        instagram_url: input.instagramUrl ?? null,
        frequency: input.frequency,
        reason: input.reason,
        content_links: input.contentLinks ?? null,
        observations: input.observations ?? null,
        status: input.status ?? "pending",
      })
      .select("*")
      .single());
  }

  if (error) {
    if (isMissingTableError(error) && fallbackToMemory) {
      return createCreatorApplicationRecord(null, input, options);
    }

    throw new Error(error.message);
  }

  const application = normalizeApplication(data as CreatorApplication);
  assertPersistentApplicationId(application.id);
  return application;
}

export async function createDiscordCreatorApplicationRecord(
  client: DatabaseClient,
  input: CreateDiscordCreatorApplicationInput,
  options?: CreateCreatorApplicationOptions,
) {
  const createdAt = input.createdAt ?? getNowIso();
  const fallbackToMemory = options?.fallbackToMemory ?? true;

  if (!client) {
    if (!fallbackToMemory) {
      throw new Error("Não foi possível salvar a inscrição no Supabase.");
    }

    const application = normalizeApplication({
      id: createMemoryId("application"),
      name: input.name,
      discord_name: input.discordName,
      discord_id: input.discordId,
      city_name: input.cityName,
      age: null,
      category: input.category,
      frequency: input.frequency,
      reason: input.reason,
      content_links: input.contentLinks ?? null,
      observations: input.observations ?? null,
      status: input.status ?? "pending",
      created_at: createdAt,
      reviewed_at: null,
      reviewed_by: null,
      source: input.source ?? "discord",
    });

    memoryState.applications.unshift(application);
    return application;
  }

  let { data, error } = await client
    .from("creator_applications")
    .insert({
      name: input.name,
      discord_name: input.discordName,
      discord_id: input.discordId,
      city_name: input.cityName,
      category: input.category,
      frequency: input.frequency,
      reason: input.reason,
      content_links: input.contentLinks ?? null,
      observations: input.observations ?? null,
      status: input.status ?? "pending",
      source: input.source ?? "discord",
      created_at: createdAt,
    })
    .select("*")
    .single();

  if (error && isMissingColumnError(error, "source")) {
    ({ data, error } = await client
      .from("creator_applications")
      .insert({
        name: input.name,
        discord_name: input.discordName,
        discord_id: input.discordId,
        city_name: input.cityName,
        category: input.category,
        frequency: input.frequency,
        reason: input.reason,
        content_links: input.contentLinks ?? null,
        observations: input.observations ?? null,
        status: input.status ?? "pending",
        created_at: createdAt,
      })
      .select("*")
      .single());
  }

  if (error) {
    if (isMissingTableError(error) && fallbackToMemory) {
      return createDiscordCreatorApplicationRecord(null, input, options);
    }

    throw new Error(error.message);
  }

  const application = normalizeApplication(data as CreatorApplication);
  assertPersistentApplicationId(application.id);
  return application;
}

export async function updateCreatorApplicationReviewMessage(
  client: DatabaseClient,
  input: UpdateCreatorApplicationReviewMessageInput,
) {
  if (!client) {
    const current = memoryState.applications.find(
      (application) => application.id === input.applicationId,
    );

    if (!current) {
      return null;
    }

    current.review_channel_id = input.reviewChannelId ?? null;
    current.review_message_id = input.reviewMessageId ?? null;
    return current;
  }

  assertPersistentApplicationId(input.applicationId);

  const { data, error } = await client
    .from("creator_applications")
    .update({
      review_channel_id: input.reviewChannelId ?? null,
      review_message_id: input.reviewMessageId ?? null,
    })
    .eq("id", input.applicationId)
    .select("*")
    .maybeSingle();

  if (
    error &&
    (isMissingColumnError(error, "review_channel_id") ||
      isMissingColumnError(error, "review_message_id"))
  ) {
    return findCreatorApplicationById(client, input.applicationId, {
      fallbackToMemory: false,
    });
  }

  if (error) {
    if (isMissingTableError(error)) {
      return updateCreatorApplicationReviewMessage(null, input);
    }

    throw new Error(error.message);
  }

  return data ? normalizeApplication(data as CreatorApplication) : null;
}

export async function reviewCreatorApplicationRecord(
  client: DatabaseClient,
  input: ReviewCreatorApplicationInput,
) {
  const reviewedAt = input.reviewedAt ?? getNowIso();

  if (!client) {
    const current = memoryState.applications.find(
      (application) => application.id === input.applicationId,
    );

    if (!current) {
      return null;
    }

    current.status = input.decision;
    current.reviewed_at = reviewedAt;
    current.reviewed_by = input.reviewedBy ?? null;
    current.reviewed_by_text = input.reviewedByText ?? null;
    current.reviewed_by_name = input.reviewedByName ?? null;
    current.rejection_reason =
      input.decision === "rejected" ? input.rejectionReason ?? null : null;
    return current;
  }

  assertPersistentApplicationId(input.applicationId);

  const updatePayload = {
    status: input.decision,
    reviewed_at: reviewedAt,
    reviewed_by: input.reviewedBy ?? null,
    reviewed_by_text: input.reviewedByText ?? null,
    reviewed_by_name: input.reviewedByName ?? null,
    rejection_reason:
      input.decision === "rejected" ? input.rejectionReason ?? null : null,
  };

  let { data, error } = await client
    .from("creator_applications")
    .update(updatePayload)
    .eq("id", input.applicationId)
    .select("*")
    .maybeSingle();

  if (
    error &&
    (isMissingColumnError(error, "reviewed_by_text") ||
      isMissingColumnError(error, "reviewed_by_name") ||
      isMissingColumnError(error, "rejection_reason"))
  ) {
    ({ data, error } = await client
      .from("creator_applications")
      .update({
        status: input.decision,
        reviewed_at: reviewedAt,
        reviewed_by: input.reviewedBy ?? null,
      })
      .eq("id", input.applicationId)
      .select("*")
      .maybeSingle());
  }

  if (error) {
    if (isMissingTableError(error)) {
      return reviewCreatorApplicationRecord(null, input);
    }

    throw new Error(error.message);
  }

  return data ? normalizeApplication(data as CreatorApplication) : null;
}

export async function syncApprovedCreatorFromApplication(
  client: DatabaseClient,
  application: CreatorApplication,
): Promise<SyncApprovedCreatorResult> {
  if (!client) {
    return {
      creatorId: null,
      profileId: null,
      created: false,
      updated: false,
      skipped: true,
      reason: "Sem banco configurado para vincular o creator aprovado.",
    };
  }

  const profile = await findProfileForApplication(client, application);

  if (!profile) {
    return {
      creatorId: null,
      profileId: null,
      created: false,
      updated: false,
      skipped: true,
      reason: "Nenhum perfil do site foi encontrado para este Discord.",
    };
  }

  if (profile.role === "creator") {
    // Keep creator role.
  } else if (profile.role !== "admin_general" && profile.role !== "responsavel_creators") {
    const { error: profileError } = await client
      .from("profiles")
      .update({ role: "creator" })
      .eq("id", profile.id);

    if (profileError && !isMissingTableError(profileError)) {
      throw new Error(profileError.message);
    }
  }

  const { data: existingCreator, error: creatorLookupError } = await client
    .from("creators")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (creatorLookupError && !isMissingTableError(creatorLookupError)) {
    throw new Error(creatorLookupError.message);
  }

  if (existingCreator) {
    const { data: updatedCreator, error: updateCreatorError } = await client
      .from("creators")
      .update({
        name: application.name,
        city_name: application.city_name,
        category: application.category,
        status: "active",
      })
      .eq("id", (existingCreator as Creator).id)
      .select("*")
      .single();

    if (updateCreatorError) {
      throw new Error(updateCreatorError.message);
    }

    await ensureCreatorRoom(client, updatedCreator.id, application.name);

    return {
      creatorId: updatedCreator.id,
      profileId: profile.id,
      created: false,
      updated: true,
      skipped: false,
      reason: null,
    };
  }

  const { data: insertedCreator, error: insertCreatorError } = await client
    .from("creators")
    .insert({
      profile_id: profile.id,
      name: application.name,
      city_name: application.city_name,
      category: application.category,
      status: "active",
    })
    .select("*")
    .single();

  if (insertCreatorError) {
    throw new Error(insertCreatorError.message);
  }

  await ensureCreatorRoom(client, insertedCreator.id, application.name);

  return {
    creatorId: insertedCreator.id,
    profileId: profile.id,
    created: true,
    updated: false,
    skipped: false,
    reason: null,
  };
}
