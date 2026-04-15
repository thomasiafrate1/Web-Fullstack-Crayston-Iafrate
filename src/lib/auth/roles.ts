import type { AppRole, InviteRole } from "@/types/database";

export const roleLabel: Record<AppRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export const isOperationalManager = (role: AppRole) =>
  role === "owner" || role === "admin";

export const isOwner = (role: AppRole) => role === "owner";

export const canInvite = (actor: AppRole, target: InviteRole) => {
  if (actor === "owner") {
    return target === "admin" || target === "member";
  }
  if (actor === "admin") {
    return target === "member";
  }
  return false;
};

export const canManageMemberRecord = (
  actor: AppRole,
  target: AppRole,
  targetUserId: string,
  actorUserId: string,
) => {
  if (targetUserId === actorUserId) {
    return false;
  }

  if (actor === "owner") {
    return target === "admin" || target === "member";
  }

  if (actor === "admin") {
    return target === "member";
  }

  return false;
};

// 🔐 Rôles autorisés pour accéder à la facturation
export function canAccessBilling(role: string | null | undefined) {
  // on sécurise les cas null/undefined
  if (!role) return false;

  // owner = accès total billing
  return role === "owner";
}