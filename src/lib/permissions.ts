import type { AppRole, SessionContext } from "@/lib/types";

export const STAFF_ROLES: AppRole[] = ["admin_general", "responsavel_creators"];

export function isStaffRole(role: AppRole | null | undefined) {
  return role === "admin_general" || role === "responsavel_creators";
}

export function canAccessCreator(actor: SessionContext, creatorId: string) {
  if (actor.isAdmin || actor.canManageCreators) {
    return true;
  }

  return actor.creator?.id === creatorId;
}

export function canSubmitMetrics(actor: SessionContext) {
  return actor.role === "creator" && Boolean(actor.creator);
}

export function canReviewMetrics(actor: SessionContext) {
  return isStaffRole(actor.role);
}

export function canManageNotices(actor: SessionContext) {
  return isStaffRole(actor.role);
}
