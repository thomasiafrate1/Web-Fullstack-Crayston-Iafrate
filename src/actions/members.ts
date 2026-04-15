"use server";

import { requireAppContext } from "@/lib/auth/session";
import { isOwner } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

// Cette action serveur supprime un membre de l'organisation (seulement pour les owners)
export async function deleteMemberAction(memberId: string) {
  // On récupère la session et on vérifie que l'utilisateur est owner
  const { profile } = await requireAppContext();

  if (!profile || !isOwner(profile.role)) {
    return { ok: false, message: "Accès refusé" };
  }

  try {
    // On utilise le client admin pour bypasser la RLS
    const adminClient = createAdminClient();

    // D'abord, on supprime les subscriptions liées au profil (contrainte de clé étrangère)
    const { error: deleteSubError } = await adminClient
      .from("subscriptions")
      .delete()
      .eq("user_id", memberId);

    if (deleteSubError) {
      console.error("ERREUR SUPPRESSION SUBSCRIPTIONS:", deleteSubError);
      return { ok: false, message: "Erreur lors de la suppression des subscriptions" };
    }

    // Ensuite, on supprime le profil
    const { error: deleteError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", memberId);

    if (deleteError) {
      console.error("ERREUR SUPPRESSION MEMBRE:", deleteError);
      return { ok: false, message: "Erreur lors de la suppression du profil" };
    }

    console.log("MEMBRE SUPPRIME:", memberId);
    return { ok: true, message: "Membre supprimé avec succès" };
  } catch (err) {
    console.error("ERREUR SERVEUR SUPPRESSION:", err);
    return { ok: false, message: "Erreur serveur" };
  }
}
