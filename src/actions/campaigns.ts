"use server";

import { revalidatePath } from "next/cache";

import { env } from "@/lib/env";
import { logAuditEvent, requireManagerContext } from "@/actions/utils";

const parseRecipients = (raw: string) =>
  raw
    .split(/[,\n;]/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

type ActionResult = { ok: boolean; error?: string };

export const createCampaignAction = async (
  formData: FormData,
): Promise<ActionResult> => {
  try {
    const context = await requireManagerContext();
    const name = String(formData.get("name") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const template = String(formData.get("template") ?? "").trim();
    const recipientsRaw = String(formData.get("recipients") ?? "").trim();

    if (!name || !subject || !template) {
      return { ok: false, error: "Nom, sujet et template sont obligatoires." };
    }

    const { data: campaign, error: campaignError } = await context.supabase
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

    if (campaignError || !campaign) {
      console.error(
        "createCampaignAction error:",
        campaignError?.message ?? "Creation campagne impossible.",
      );
      return { ok: false, error: campaignError?.message ?? "Creation campagne impossible." };
    }

    const recipients = parseRecipients(recipientsRaw);
    if (recipients.length > 0) {
      const rows = recipients.map((email) => ({
        campaign_id: campaign.id,
        org_id: context.orgId,
        email,
        status: "draft" as const,
      }));

      const { error: recipientError } = await context.supabase
        .from("campaign_recipients")
        .upsert(rows, { onConflict: "campaign_id,email" });

      if (recipientError) {
        console.error("createCampaignAction recipient error:", recipientError.message);
        return { ok: false, error: recipientError.message };
      }
    }

    await logAuditEvent(context, "campaign.create", "campaign", campaign.id, {
      recipients: recipients.length,
    });
    revalidatePath("/campagnes");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    console.error("createCampaignAction exception:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Creation campagne impossible.",
    };
  }
};

export const deleteCampaignAction = async (formData: FormData): Promise<void> => {
  try {
    const context = await requireManagerContext();
    const campaignId = String(formData.get("campaignId") ?? "").trim();
    if (!campaignId) {
      return;
    }

    const { error } = await context.supabase
      .from("campaigns")
      .delete()
      .eq("id", campaignId)
      .eq("org_id", context.orgId);

    if (error) {
      console.error("deleteCampaignAction error:", error.message);
      return;
    }

    await logAuditEvent(context, "campaign.delete", "campaign", campaignId);
    revalidatePath("/campagnes");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("deleteCampaignAction exception:", error);
  }
};

export const sendCampaignAction = async (formData: FormData): Promise<void> => {
  try {
    const context = await requireManagerContext();
    const campaignId = String(formData.get("campaignId") ?? "").trim();
    if (!campaignId) {
      return;
    }

    await context.supabase
      .from("campaigns")
      .update({ status: "sending", updated_at: new Date().toISOString() })
      .eq("id", campaignId)
      .eq("org_id", context.orgId);

    if (env.resendFunctionName) {
      const { error: functionError } = await context.supabase.functions.invoke(
        env.resendFunctionName,
        {
          body: { campaignId, orgId: context.orgId },
        },
      );

      if (functionError) {
        await context.supabase
          .from("campaigns")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", campaignId)
          .eq("org_id", context.orgId);
        console.error("sendCampaignAction function error:", functionError.message);
        return;
      }
    } else {
      await context.supabase
        .from("campaign_recipients")
        .update({
          status: "queued",
        })
        .eq("campaign_id", campaignId)
        .eq("org_id", context.orgId);
    }

    await context.supabase
      .from("campaigns")
      .update({ status: "sent", updated_at: new Date().toISOString() })
      .eq("id", campaignId)
      .eq("org_id", context.orgId);

    await logAuditEvent(context, "campaign.send", "campaign", campaignId);
    revalidatePath("/campagnes");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("sendCampaignAction exception:", error);
  }
};
