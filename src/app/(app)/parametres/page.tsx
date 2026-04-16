import {
  removeMemberAction,
  updateMemberRoleAction,
  updateOrganizationAction,
} from "@/actions/settings";
import { AddMemberModal } from "@/components/settings/add-member-modal";
import {
  canManageMemberRecord,
  isOperationalManager,
  isOwner,
  roleLabel,
} from "@/lib/auth/roles";
import { requireAppContext } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

export default async function SettingsPage() {
  // Vérification des permissions pour l'accès aux paramètres
  const { supabase, profile, user } = await requireAppContext();
  const canManage = isOperationalManager(profile.role);
  const ownerOnly = isOwner(profile.role);

  // Récupération des infos organisation et membres
  const [organizationRes, membersRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug, plan, timezone, language")
      .eq("id", profile.org_id)
      .single(),
    supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .eq("org_id", profile.org_id)
      .order("created_at", { ascending: true }),
  ]);

  const organization = organizationRes.data;
  const members = membersRes.data ?? [];

  // Affichage de la page paramètres avec gestion organisation et équipe
  return (
    <div className="space-y-4">
      <header className="rf-card p-6">
        <h1 className="rf-page-title text-3xl font-semibold">Parametres</h1>
        <p className="mt-2 text-[var(--rf-text-muted)]">
          Gestion organisation, equipe et securite.
        </p>
      </header>

      <section className="rf-card p-5">
        <p className="rf-badge">{roleLabel[profile.role]}</p>
        <h2 className="rf-page-title mt-2 text-xl font-semibold">Organisation</h2>
        {organization ? (
          <form action={updateOrganizationAction} className="mt-3 grid gap-3 md:grid-cols-3">
            <div>
              <label className="rf-label" htmlFor="orgName">
                Nom
              </label>
              <input
                id="orgName"
                name="name"
                className="rf-input"
                defaultValue={organization.name}
                disabled={!ownerOnly}
              />
            </div>
            <div>
              <label className="rf-label" htmlFor="orgSlug">
                Slug
              </label>
              <input
                id="orgSlug"
                name="slug"
                className="rf-input"
                defaultValue={organization.slug}
                disabled={!ownerOnly}
              />
            </div>
            <div>
              <label className="rf-label" htmlFor="orgPlan">
                Plan
              </label>
              <select
                id="orgPlan"
                name="plan"
                className="rf-select"
                defaultValue={organization.plan}
                disabled={!ownerOnly}
              >
                <option value="free">free</option>
                <option value="pro">pro</option>
              </select>
            </div>
            {ownerOnly ? (
              <div className="md:col-span-3">
                <button className="rf-btn rf-btn-primary" type="submit">
                  Sauvegarder l&apos;organisation
                </button>
              </div>
            ) : (
              <p className="md:col-span-3 text-sm text-[var(--rf-text-muted)]">
                Les changements organisation sont reserves au owner.
              </p>
            )}
          </form>
        ) : (
          <p className="mt-3 text-sm text-[var(--rf-danger)]">
            Impossible de charger l&apos;organisation.
          </p>
        )}
      </section>

      <section className="rf-card p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="rf-page-title text-xl font-semibold">Equipe</h2>
          {canManage ? <AddMemberModal actorRole={profile.role} /> : null}
        </div>
        <div className="overflow-x-auto">
          <table className="rf-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Role</th>
                <th>Arrivee</th>
                {canManage ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const canRemove = canManageMemberRecord(
                  profile.role,
                  member.role,
                  member.id,
                  user.id,
                );
                const canUpdateRole = ownerOnly && member.role !== "owner" && member.id !== user.id;
                return (
                  <tr key={member.id}>
                    <td>{member.full_name || "-"}</td>
                    <td>{member.email}</td>
                    <td>
                      <span className="rf-badge">{member.role}</span>
                    </td>
                    <td>{formatDate(member.created_at)}</td>
                    {canManage ? (
                      <td className="space-y-2">
                        {canUpdateRole ? (
                          <form action={updateMemberRoleAction} className="flex gap-2">
                            <input type="hidden" name="targetUserId" value={member.id} />
                            <select
                              name="targetRole"
                              className="rf-select"
                              defaultValue={member.role}
                            >
                              <option value="member">member</option>
                              <option value="admin">admin</option>
                            </select>
                            <button className="rf-btn rf-btn-outline" type="submit">
                              MAJ
                            </button>
                          </form>
                        ) : null}

                        {canRemove ? (
                          <form action={removeMemberAction}>
                            <input type="hidden" name="targetUserId" value={member.id} />
                            <button className="rf-btn rf-btn-danger" type="submit">
                              Retirer
                            </button>
                          </form>
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
              {members.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="text-[var(--rf-text-muted)]">
                    Aucun membre.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {ownerOnly ? (
        <section className="rf-card border-[#6d2635] bg-[#22131a] p-5">
          <h2 className="rf-page-title text-xl font-semibold text-[#ff9bac]">Danger Zone</h2>
          <p className="mt-2 text-sm text-[var(--rf-text-muted)]">
            La suppression d&apos;organisation doit rester une operation controlee et confirmee
            (non activee dans cette version).
          </p>
        </section>
      ) : null}
    </div>
  );
}
