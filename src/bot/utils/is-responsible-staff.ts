import { GuildMember, PermissionFlagsBits } from "discord.js";

import type { BotContext } from "../types";

export function isGuildMember(member: unknown): member is GuildMember {
  return member instanceof GuildMember;
}

export function isResponsibleStaff(
  context: BotContext,
  member: GuildMember | null | undefined,
) {
  if (!(member instanceof GuildMember)) {
    return false;
  }

  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.roles.cache.some((role) => context.config.staffRoleIds.includes(role.id))
  );
}
