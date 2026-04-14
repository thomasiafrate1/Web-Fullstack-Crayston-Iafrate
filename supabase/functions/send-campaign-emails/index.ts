// deno-lint-ignore-file no-explicit-any
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { campaignId, orgId } = await req.json();
    if (!campaignId || !orgId) {
      return new Response(JSON.stringify({ error: "campaignId and orgId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, name, subject, template")
      .eq("id", campaignId)
      .eq("org_id", orgId)
      .maybeSingle();

    if (!campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // V2 behavior: update recipients to queued.
    // Production behavior can plug Resend here using RESEND_API_KEY and RESEND_FROM_EMAIL.
    await supabase
      .from("campaign_recipients")
      .update({ status: "queued" })
      .eq("campaign_id", campaignId)
      .eq("org_id", orgId);

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Campaign recipients queued. Plug Resend for production sending.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
