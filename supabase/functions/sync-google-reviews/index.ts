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
    const { orgId, items } = await req.json();
    if (!orgId || !Array.isArray(items)) {
      return new Response(JSON.stringify({ error: "orgId and items[] are required" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const rows = items.map((item: Record<string, unknown>) => ({
      org_id: orgId,
      source: "google",
      external_id: String(item.external_id ?? ""),
      author_name: item.author_name ? String(item.author_name) : null,
      rating: Number(item.rating ?? 5),
      content: item.content ? String(item.content) : null,
      published_at: item.published_at ? String(item.published_at) : new Date().toISOString(),
      status: "new",
    }));

    const { error } = await supabase.from("reviews").upsert(rows, {
      onConflict: "org_id,external_id",
      ignoreDuplicates: false,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, upserted: rows.length }), {
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
