import type { AppRole, SessionContext } from "@/lib/types";

export const STAFF_ROLES: AppRole[] = ["admin_general", "responsavel_creators"];

export function normalizeAppRole(value: string | null | undefined): AppRole | null {
  switch (value) {
    case "admin":
    case "admin_general":
      return "admin_general";
    case "responsible_creator":
    case "responsavel_creators":
      return "responsavel_creators";
    case "creator":
      return "creator";
    default:
      return null;
  }
}

export function isStaffRole(role: AppRole | null | undefined) {
  return role === "admin_general" || role === "responsavel_creators";
}

export function getRoleHomePath(role: AppRole) {
  return role === "creator" ? "/room" : "/central/creators";
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
