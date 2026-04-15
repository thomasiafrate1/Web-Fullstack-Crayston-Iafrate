import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ResendResponse {
  id?: string;
  error?: string;
  message?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Missing Supabase environment variables",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { campaignId, orgId, resendKey } = body;

    if (!campaignId || !orgId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing campaignId or orgId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!resendKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing resendKey" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // GET CAMPAIGN
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("subject, template")
      .eq("id", campaignId)
      .eq("org_id", orgId)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ ok: false, error: "Campaign not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET RECIPIENTS
    const { data: recipients, error: recipientsError } = await supabase
      .from("campaign_recipients")
      .select("email, id")
      .eq("campaign_id", campaignId)
      .eq("org_id", orgId);

    if (recipientsError) {
      return new Response(
        JSON.stringify({ ok: false, error: "Failed to fetch recipients" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!recipients || recipients.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "No recipients found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SEND EMAILS
    const results: Array<{
      email: string;
      success?: boolean;
      messageId?: string;
      error?: string;
    }> = [];
    let successCount = 0;
    let failureCount = 0;

    for (const recipient of recipients) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "onboarding@resend.dev",
            to: recipient.email,
            subject: campaign.subject || "No Subject",
            html: campaign.template || "<p>Empty</p>",
          }),
        });

        const resendData = (await response.json()) as ResendResponse;

        if (!response.ok || !resendData.id) {
          const errorMsg = resendData.error || response.statusText;
          failureCount++;
          results.push({
            email: recipient.email,
            success: false,
            error: errorMsg,
          });

          // Update recipient status (fire and forget)
          supabase
            .from("campaign_recipients")
            .update({ status: "failed" })
            .eq("id", recipient.id)
            .then(() => {})
            .catch(() => {});

          continue;
        }

        successCount++;
        results.push({
          email: recipient.email,
          success: true,
          messageId: resendData.id,
        });

        // Update recipient status (fire and forget)
        supabase
          .from("campaign_recipients")
          .update({
            status: "sent",
            provider_message_id: resendData.id,
            sent_at: new Date().toISOString(),
          })
          .eq("id", recipient.id)
          .then(() => {})
          .catch(() => {});
      } catch (err) {
        failureCount++;
        results.push({
          email: recipient.email,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });

        // Update recipient status (fire and forget)
        supabase
          .from("campaign_recipients")
          .update({ status: "failed" })
          .eq("id", recipient.id)
          .then(() => {})
          .catch(() => {});
      }
    }

    const allSuccess = failureCount === 0;

    return new Response(
      JSON.stringify({
        ok: allSuccess,
        successCount,
        failureCount,
        totalRecipients: recipients.length,
        results: results.slice(0, 10),
      }),
      {
        status: allSuccess ? 200 : 207,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    return new Response(
      JSON.stringify({
        ok: false,
        error: errorMsg,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});