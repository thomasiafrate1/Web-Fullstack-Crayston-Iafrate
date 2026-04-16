import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/auth/session";
import { isOwner } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import MembersList from "@/components/members/members-list";

export default async function MembersPage() {
  // Vérification de l'accès propriétaire
  const { profile } = await requireAppContext();

  if (!profile || !isOwner(profile.role)) {
    redirect("/dashboard");
  }

  // Récupération de tous les membres via le client admin
  const adminClient = createAdminClient();

  // On récupère TOUS les profiles de la table
  const { data: members, error } = await adminClient
    .from("profiles")
    .select("*");

  if (error) {
    console.error("ERREUR FETCH MEMBRES:", error);
  }

  // Affichage de la page de gestion des membres
  return (
    <div className="space-y-6">
      {/* Titre et description de la page */}
      <header>
        <h1 className="rf-page-title text-3xl font-semibold">Membres</h1>
        <p className="rf-subtitle mt-2">Gère les membres de ton organisation</p>
      </header>

      {/* Affiche la liste des membres */}
      <section className="rf-card p-6">
        <MembersList members={members || []} />
      </section>
    </div>
  );
}
