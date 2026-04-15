import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const eventType = String(body.type ?? "");
    const data = (body.data ?? {}) as Record<string, unknown>;

    const orgId = String(data.org_id ?? "");
    if (!orgId) {
      return new Response(JSON.stringify({ error: "org_id is required in webhook payload" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (eventType === "subscription.updated") {
      const plan = String(data.plan ?? "free");

      await supabase.from("subscriptions").upsert(
        {
          org_id: orgId,
          provider: "stripe",
          provider_subscription_id: String(data.subscription_id ?? ""),
          plan,
          status: String(data.status ?? "inactive"),
          renews_at: data.renews_at ? String(data.renews_at) : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "org_id" },
      );

      await supabase
        .from("organizations")
        .update({
          plan: plan === "pro" ? "pro" : "free",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orgId);
    }

    if (eventType === "invoice.created") {
      await supabase.from("invoices").insert({
        org_id: orgId,
        provider_invoice_id: String(data.invoice_id ?? ""),
        amount_cents: Number(data.amount_cents ?? 0),
        currency: String(data.currency ?? "eur"),
        status: String(data.status ?? "pending"),
        invoice_url: data.invoice_url ? String(data.invoice_url) : null,
        issued_at: data.issued_at ? String(data.issued_at) : new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
