"use server";

import { revalidatePath } from "next/cache";
import { logAuditEvent, requireManagerContext } from "@/actions/utils";

const parseRecipients = (raw: string) =>
  raw
    .split(/[\n,;]/)
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

// Crée une campagne avec ses destinataires
export const createCampaignAction = async (formData: FormData) => {
  try {
    const context = await requireManagerContext();

    const name = String(formData.get("name") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const template = String(formData.get("template") ?? "").trim();
    const recipientsRaw = String(formData.get("recipients") ?? "").trim();

    if (!name || !subject || !template) {
      return { ok: false, error: "Missing fields" };
    }

    const { data: campaign, error } = await context.supabase
      .from("campaigns")
      .insert({
        org_id: context.orgId,
        name,
        subject,
        template,
        status: "draft",
        created_by: context.userId,
      })
      .select("id")
      .single();

    if (error || !campaign) {
      return { ok: false, error: error?.message };
    }

    const recipients = parseRecipients(recipientsRaw);

    if (recipients.length > 0) {
      await context.supabase.from("campaign_recipients").upsert(
        recipients.map((email) => ({
          campaign_id: campaign.id,
          org_id: context.orgId,
          email,
          status: "draft",
        })),
        { onConflict: "campaign_id,email" },
      );
    }

    await logAuditEvent(context, "campaign.create", "campaign", campaign.id);
    revalidatePath("/campagnes");

    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
};

// Supprime une campagne
export const deleteCampaignAction = async (formData: FormData) => {
  try {
    const context = await requireManagerContext();
    const campaignId = String(formData.get("campaignId") ?? "").trim();

    if (!campaignId) return;

    await context.supabase
      .from("campaigns")
      .delete()
      .eq("id", campaignId)
      .eq("org_id", context.orgId);

    await logAuditEvent(context, "campaign.delete", "campaign", campaignId);
    revalidatePath("/campagnes");
  } catch (e) {
    console.error(e);
  }
};

// Déclenche l'envoi d'une campagne via Edge Function
export const sendCampaignAction = async (formData: FormData): Promise<void> => {
  try {
    const context = await requireManagerContext();
    const campaignId = String(formData.get("campaignId") ?? "").trim();

    if (!campaignId) return;

    await context.supabase
      .from("campaigns")
      .update({
        status: "sending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId)
      .eq("org_id", context.orgId);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const resendKey = process.env.RESEND_API_KEY;

      if (!supabaseUrl || !supabaseServiceKey || !resendKey) {
        throw new Error("Missing Supabase or Resend configuration");
      }

      const functionUrl = `${supabaseUrl}/functions/v1/send-campaign-emails`;

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          campaignId,
          orgId: context.orgId,
          resendKey,
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        successCount?: number;
        failureCount?: number;
      };

      if (!response.ok || !result.ok) {
        await context.supabase
          .from("campaigns")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", campaignId)
          .eq("org_id", context.orgId);

        console.error("Campaign send failed:", result.error ?? response.statusText);
        return;
      }
    } catch (fetchError) {
      await context.supabase
        .from("campaigns")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId)
        .eq("org_id", context.orgId);

      console.error(
        "Campaign send failed:",
        fetchError instanceof Error ? fetchError.message : fetchError,
      );
      return;
    }

    await context.supabase
      .from("campaigns")
      .update({
        status: "sent",
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId)
      .eq("org_id", context.orgId);

    await logAuditEvent(context, "campaign.send", "campaign", campaignId);
    revalidatePath("/campagnes");
  } catch (e) {
    const errorMsg = (e as Error).message;
    console.error("Send campaign error:", errorMsg);
  }
};
