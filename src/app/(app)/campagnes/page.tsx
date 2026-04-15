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

  // Group recipients by campaign and status
  const recipientsByStatus = recipients.reduce<
    Record<string, Record<string, number>>
  >((acc, row) => {
    if (!acc[row.campaign_id]) {
      acc[row.campaign_id] = {
        total: 0,
        sent: 0,
        opened: 0,
        clicked: 0,
      };
    }
    acc[row.campaign_id].total++;
    if (row.status === "sent" || row.status === "opened" || row.status === "clicked") {
      acc[row.campaign_id].sent++;
    }
    if (row.status === "opened") {
      acc[row.campaign_id].opened++;
    }
    if (row.status === "clicked") {
      acc[row.campaign_id].clicked++;
    }
    return acc;
  }, {});

  // Calculate average metrics for active campaigns
  const activeCampaigns = campaignRows.filter((c) => recipientsByStatus[c.id]?.sent > 0);
  
  let avgOpenRate = 0;
  let avgConversionRate = 0;

  if (activeCampaigns.length > 0) {
    const totalSent = activeCampaigns.reduce(
      (sum, c) => sum + (recipientsByStatus[c.id]?.sent ?? 0),
      0
    );
    const totalOpened = activeCampaigns.reduce(
      (sum, c) => sum + (recipientsByStatus[c.id]?.opened ?? 0),
      0
    );
    const totalClicked = activeCampaigns.reduce(
      (sum, c) => sum + (recipientsByStatus[c.id]?.clicked ?? 0),
      0
    );

    avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    avgConversionRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
  }

  const totalSent = recipients.filter((r) => 
    r.status === "sent" || r.status === "opened" || r.status === "clicked"
  ).length;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="rf-page-title text-3xl font-semibold">
            Campagnes
          </h1>
          <p className="rf-subtitle mt-2">
            Creez et gerez vos campagnes de collecte d&apos;avis
          </p>
        </div>

        {canManage ? <NewCampaignModal /> : null}
      </header>

      {/* KPI */}
      <section className="grid gap-4 xl:grid-cols-4">
        <article className="rf-kpi">
          <p className="text-sm text-[var(--rf-text-muted)]">
            Campagnes actives
          </p>
          <p className="mt-4 text-4xl font-semibold">
            {campaignRows.length}
          </p>
        </article>

        <article className="rf-kpi">
          <p className="text-sm text-[var(--rf-text-muted)]">
            Emails envoyes
          </p>
          <p className="mt-4 text-4xl font-semibold">
            {totalSent.toLocaleString("fr-FR")}
          </p>
        </article>

        <article className="rf-kpi">
          <p className="text-sm text-[var(--rf-text-muted)]">
            Taux d&apos;ouverture moyen
          </p>
          <p className="mt-4 text-4xl font-semibold">
            {avgOpenRate.toFixed(1)}%
          </p>
        </article>

        <article className="rf-kpi">
          <p className="text-sm text-[var(--rf-text-muted)]">
            Taux de conversion moyen
          </p>
          <p className="mt-4 text-4xl font-semibold">
            {avgConversionRate.toFixed(1)}%
          </p>
        </article>
      </section>

      {/* TABLE */}
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
              {campaignRows.map((campaign) => {
                const stats = recipientsByStatus[campaign.id] ?? {
                  total: 0,
                  sent: 0,
                  opened: 0,
                  clicked: 0,
                };

                const sent = stats.sent;
                const opens = stats.opened;
                const clicks = stats.clicked;
                const conversionRate =
                  sent > 0 ? ((clicks / sent) * 100).toFixed(1) : "0.0";

                return (
                  <tr key={campaign.id}>
                    <td className="font-semibold">
                      {campaign.name}
                    </td>

                    <td>
                      <span
                        className={
                          STATUS_CLASS[campaign.status] ??
                          "rf-badge"
                        }
                      >
                        {campaign.status}
                      </span>
                    </td>

                    <td>{sent}</td>
                    <td>{opens}</td>
                    <td>{clicks}</td>
                    <td>-</td>

                    <td>
                      <span className="rf-badge">
                        {conversionRate}%
                      </span>
                    </td>

                    <td>
                      {formatDate(campaign.created_at)}
                    </td>

                    {canManage ? (
                      <td className="space-y-2">

                        {/* SEND */}
                        <form action={sendCampaignAction}>
                          <input
                            type="hidden"
                            name="campaignId"
                            value={campaign.id}
                          />
                          <button
                            className="rf-btn rf-btn-outline w-full"
                            type="submit"
                          >
                            Envoyer
                          </button>
                        </form>

                        {/* DELETE */}
                        <form action={deleteCampaignAction}>
                          <input
                            type="hidden"
                            name="campaignId"
                            value={campaign.id}
                          />
                          <button
                            className="rf-btn rf-btn-danger w-full"
                            type="submit"
                          >
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
                  <td
                    colSpan={canManage ? 9 : 8}
                    className="text-[var(--rf-text-muted)]"
                  >
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