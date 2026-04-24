import type { RoleId, RoleMeta, Round } from "@/app/_game/types";

const roleMetaById: Record<RoleId, RoleMeta> = {
  citizen: {
    id: "citizen",
    label: "Civil",
    emoji: "🙂",
    description: "Conoces la palabra secreta y debes describirla sin delatarla.",
    tone: "default",
  },
  impostor: {
    id: "impostor",
    label: "Impostor",
    emoji: "🕵️",
    description: "No conoces la palabra. Escucha con cuidado y da una pista creíble.",
    tone: "danger",
  },
};

export function getPlayerRole(playerId: string, round: Round | null | undefined): RoleId {
  return round?.impostorPlayerId === playerId ? "impostor" : "citizen";
}

export function getRoleMeta(roleId: RoleId): RoleMeta {
  return roleMetaById[roleId];
}
