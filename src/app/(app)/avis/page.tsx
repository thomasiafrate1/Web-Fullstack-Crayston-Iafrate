import { updateReviewStatusAction } from "@/actions/reviews";
import { isOperationalManager } from "@/lib/auth/roles";
import { requireAppContext } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";
import type { ReviewStatus } from "@/types/database";

type ReviewsPageProps = {
  searchParams: Promise<{
    q?: string;
    rating?: string;
    status?: string;
  }>;
};

const REVIEW_STATUSES: ReviewStatus[] = ["new", "in_progress", "resolved", "archived"];

const ratingLabel = (rating: number) => `${rating}/5`;

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const params = await searchParams;
  // Construction de la requête filtrée selon les paramètres de recherche
  const { supabase, profile } = await requireAppContext();
  const canManage = isOperationalManager(profile.role);

  let query = supabase
    .from("reviews")
    .select("id, author_name, rating, content, source, status, published_at, created_at")
    .eq("org_id", profile.org_id)
    .neq("source", "internal")
    .order("created_at", { ascending: false });

  if (params.q?.trim()) {
    const safeQuery = params.q.trim().replaceAll(",", " ");
    query = query.or(`author_name.ilike.%${safeQuery}%,content.ilike.%${safeQuery}%`);
  }
  if (params.rating && ["1", "2", "3", "4", "5"].includes(params.rating)) {
    query = query.eq("rating", Number(params.rating));
  }
  if (params.status && REVIEW_STATUSES.includes(params.status as ReviewStatus)) {
    query = query.eq("status", params.status as ReviewStatus);
  }

  const { data: reviews } = await query;
  const rows = reviews ?? [];
  const newCount = rows.filter((review) => review.status === "new").length;
  const resolvedCount = rows.filter((review) => review.status === "resolved").length;

  // Affichage du tableau de bord des avis avec statistiques et tableau filtrable
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="rf-page-title text-3xl font-semibold">Avis</h1>
          <p className="rf-subtitle mt-2">Gerez vos avis externes</p>
        </div>
        <button className="rf-btn rf-btn-primary">Exporter</button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rf-kpi">
          <p className="text-sm text-[var(--rf-text-muted)]">Total avis externes</p>
          <p className="mt-4 text-4xl font-semibold">{rows.length}</p>
        </article>
        <article className="rf-kpi">
          <p className="text-sm text-[var(--rf-text-muted)]">Nouveaux</p>
          <p className="mt-4 text-4xl font-semibold">{newCount}</p>
        </article>
        <article className="rf-kpi">
          <p className="text-sm text-[var(--rf-text-muted)]">Resolus</p>
          <p className="mt-4 text-4xl font-semibold">{resolvedCount}</p>
        </article>
      </section>

      <section className="rf-card p-4">
        <form className="grid gap-3 md:grid-cols-[1fr,170px,170px,130px]">
          <input
            name="q"
            className="rf-input"
            defaultValue={params.q ?? ""}
            placeholder="Rechercher par nom ou commentaire..."
          />
          <select name="rating" className="rf-select" defaultValue={params.rating ?? ""}>
            <option value="">Toutes les notes</option>
            {[1, 2, 3, 4, 5].map((value) => (
              <option value={value} key={value}>
                {value} etoiles
              </option>
            ))}
          </select>
          <select name="status" className="rf-select" defaultValue={params.status ?? ""}>
            <option value="">Tous les statuts</option>
            {REVIEW_STATUSES.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
          <button className="rf-btn rf-btn-outline" type="submit">
            Filtres
          </button>
        </form>
      </section>

      <section className="rf-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="rf-table">
            <thead>
              <tr>
                <th>Auteur</th>
                <th>Note</th>
                <th>Commentaire</th>
                <th>Date</th>
                <th>Statut</th>
                {canManage ? <th>Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((review) => (
                <tr key={review.id}>
                  <td>
                    <p className="font-semibold">{review.author_name || "Client"}</p>
                    <p className="text-xs text-[var(--rf-text-muted)]">google</p>
                  </td>
                  <td>
                    <span className="rf-badge">{ratingLabel(review.rating)}</span>
                  </td>
                  <td className="max-w-[520px] whitespace-normal text-sm">
                    {review.content || "-"}
                  </td>
                  <td>{formatDate(review.published_at || review.created_at)}</td>
                  <td>
                    <span
                      className={`rf-badge ${
                        review.status === "resolved"
                          ? "rf-badge-success"
                          : review.status === "in_progress"
                            ? "rf-badge-warning"
                            : ""
                      }`}
                    >
                      {review.status}
                    </span>
                  </td>
                  {canManage ? (
                    <td>
                      <form action={updateReviewStatusAction} className="flex gap-2">
                        <input type="hidden" name="reviewId" value={review.id} />
                        <select name="status" defaultValue={review.status} className="rf-select">
                          {REVIEW_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button className="rf-btn rf-btn-outline" type="submit">
                          MAJ
                        </button>
                      </form>
                    </td>
                  ) : null}
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="text-[var(--rf-text-muted)]">
                    Aucun avis externe sur les filtres en cours.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
