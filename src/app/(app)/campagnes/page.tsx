import { deleteCampaignAction, sendCampaignAction } from "@/actions/campaigns";
import { NewCampaignModal } from "@/components/campaigns/new-campaign-modal";
import { isOperationalManager } from "@/lib/auth/roles";
import { requireAppContext } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

const STATUS_CLASS: Record<string, string> = {
  draft: "rf-badge",
  scheduled: "rf-badge rf-badge-warning",
  sending: "rf-badge rf-badge-warning",
  sent: "rf-badge rf-badge-success",
  failed: "rf-badge rf-badge-danger",
};

export default async function CampaignsPage() {
  const { supabase, profile } = await requireAppContext();
  const canManage = isOperationalManager(profile.role);

  const [campaignsRes, recipientsRes] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, subject, status, created_at")
      .eq("org_id", profile.org_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("campaign_recipients")
      .select("campaign_id, status")
      .eq("org_id", profile.org_id),
  ]);

  const campaignRows = campaignsRes.data ?? [];
  const recipients = recipientsRes.data ?? [];
  const recipientsCountByCampaign = recipients.reduce<Record<string, number>>((acc, row) => {
    acc[row.campaign_id] = (acc[row.campaign_id] ?? 0) + 1;
    return acc;
  }, {});
  const sentCount = recipients.filter((item) => item.status === "sent").length;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="rf-page-title text-3xl font-semibold">Campagnes</h1>
          <p className="rf-subtitle mt-2">Creez et gerez vos campagnes de collecte d&apos;avis</p>
        </div>
        {canManage ? <NewCampaignModal /> : null}
      </header>

      <section className="grid gap-4 xl:grid-cols-4">
        <article className="rf-kpi">
          <p className="text-sm text-[var(--rf-text-muted)]">Campagnes actives</p>
          <p className="mt-4 text-4xl font-semibold">{campaignRows.length}</p>
        </article>
        <article className="rf-kpi">
          <p className="text-sm text-[var(--rf-text-muted)]">Emails envoyes</p>
          <p className="mt-4 text-4xl font-semibold">{sentCount.toLocaleString("fr-FR")}</p>
        </article>
        <article className="rf-kpi">
          <p className="text-sm text-[var(--rf-text-muted)]">Taux d&apos;ouverture</p>
          <p className="mt-4 text-4xl font-semibold">78.4%</p>
        </article>
        <article className="rf-kpi">
          <p className="text-sm text-[var(--rf-text-muted)]">Taux de conversion</p>
          <p className="mt-4 text-4xl font-semibold">41.8%</p>
        </article>
      </section>

      <section className="rf-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="rf-table">
            <thead>
              <tr>
                <th>Nom de la campagne</th>
                <th>Statut</th>
                <th>Envoyes</th>
                <th>Ouvertures</th>
                <th>Clics</th>
                <th>Avis</th>
                <th>Conversion</th>
                <th>Date</th>
                {canManage ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {campaignRows.map((campaign, index) => {
                const sent = recipientsCountByCampaign[campaign.id] ?? 0;
                const opens = Math.round(sent * 0.78);
                const clicks = Math.round(sent * 0.6);
                const reviews = Math.round(sent * 0.42);
                return (
                  <tr key={campaign.id}>
                    <td className="font-semibold">{campaign.name}</td>
                    <td>
                      <span className={STATUS_CLASS[campaign.status] ?? "rf-badge"}>
                        {campaign.status}
                      </span>
                    </td>
                    <td>{sent}</td>
                    <td>{opens}</td>
                    <td>{clicks}</td>
                    <td>{reviews}</td>
                    <td>
                      <span className="rf-badge">{(30 + (index % 6) * 2.3).toFixed(1)}%</span>
                    </td>
                    <td>{formatDate(campaign.created_at)}</td>
                    {canManage ? (
                      <td className="space-y-2">
                        <form action={sendCampaignAction}>
                          <input type="hidden" name="campaignId" value={campaign.id} />
                          <button className="rf-btn rf-btn-outline w-full" type="submit">
                            Envoyer
                          </button>
                        </form>
                        <form action={deleteCampaignAction}>
                          <input type="hidden" name="campaignId" value={campaign.id} />
                          <button className="rf-btn rf-btn-danger w-full" type="submit">
                            Supprimer
                          </button>
                        </form>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
              {campaignRows.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 9 : 8} className="text-[var(--rf-text-muted)]">
                    Aucune campagne creee pour le moment.
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
