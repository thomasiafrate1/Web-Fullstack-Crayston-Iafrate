import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/auth/session";
import { isOwner } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import MembersList from "@/components/members/members-list";

export default async function MembersPage() {
  // On récupère la session et on vérifie que l'utilisateur est owner
  const { profile } = await requireAppContext();

  // Si pas owner, on redirige vers le dashboard
  if (!profile || !isOwner(profile.role)) {
    redirect("/dashboard");
  }

  // On utilise le client admin pour bypasser la RLS
  const adminClient = createAdminClient();

  // On récupère TOUS les profiles de la table
  const { data: members, error } = await adminClient
    .from("profiles")
    .select("*");

  if (error) {
    console.error("ERREUR FETCH MEMBRES:", error);
  }

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
