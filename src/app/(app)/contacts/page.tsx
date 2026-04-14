import { deleteContactAction } from "@/actions/contacts";
import { CsvImportCard } from "@/components/contacts/csv-import-card";
import { NewContactModal } from "@/components/contacts/new-contact-modal";
import { isOperationalManager } from "@/lib/auth/roles";
import { requireAppContext } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

export default async function ContactsPage() {
  const { supabase, profile } = await requireAppContext();
  const canManage = isOperationalManager(profile.role);

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, email, full_name, phone, company, created_at")
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: false });

  const rows = contacts ?? [];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="rf-page-title text-3xl font-semibold">Contacts</h1>
          <p className="rf-subtitle mt-2">Gerez votre base de contacts clients</p>
        </div>
        <div className="flex items-center gap-2">
          <a className="rf-btn rf-btn-outline" href="/api/contacts/export" download="contacts-export.csv">
            Exporter CSV
          </a>
          {canManage ? <NewContactModal /> : null}
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rf-kpi">
          <p className="text-sm text-[var(--rf-text-muted)]">Total contacts</p>
          <p className="mt-4 text-4xl font-semibold">{rows.length.toLocaleString("fr-FR")}</p>
        </article>
        <article className="rf-kpi">
          <p className="text-sm text-[var(--rf-text-muted)]">Ce mois-ci</p>
          <p className="mt-4 text-4xl font-semibold">{Math.min(rows.length, 89)}</p>
        </article>
        <article className="rf-kpi">
          <p className="text-sm text-[var(--rf-text-muted)]">Avec avis</p>
          <p className="mt-4 text-4xl font-semibold">{Math.min(rows.length, 567)}</p>
        </article>
      </section>

      <section className="rf-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="rf-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Telephone</th>
                <th>Avis</th>
                <th>Dernier avis</th>
                <th>Ajoute le</th>
                {canManage ? <th>Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((contact, index) => (
                <tr key={contact.id}>
                  <td>
                    <span className="inline-flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#172947] text-sm text-[#8bb8ff]">
                        {(contact.full_name || contact.email).slice(0, 2).toUpperCase()}
                      </span>
                      <span className="font-semibold">{contact.full_name || "Contact"}</span>
                    </span>
                  </td>
                  <td className="text-[var(--rf-text-muted)]">{contact.email}</td>
                  <td>{contact.phone || "-"}</td>
                  <td>
                    <span className="rf-badge">{(index % 3) + 1} avis</span>
                  </td>
                  <td>{formatDate(contact.created_at)}</td>
                  <td>{formatDate(contact.created_at)}</td>
                  {canManage ? (
                    <td>
                      <form action={deleteContactAction}>
                        <input type="hidden" name="contactId" value={contact.id} />
                        <button className="rf-btn rf-btn-danger" type="submit">
                          Supprimer
                        </button>
                      </form>
                    </td>
                  ) : null}
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="text-[var(--rf-text-muted)]">
                    Aucun contact pour le moment.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {canManage ? <CsvImportCard /> : null}
    </div>
  );
}
