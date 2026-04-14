import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const inferSentiment = (rating: number) => {
  if (rating >= 4) {
    return { label: "positive", score: 0.8 };
  }
  if (rating <= 2) {
    return { label: "negative", score: -0.6 };
  }
  return { label: "neutral", score: 0.1 };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { reviewId } = await req.json();
    if (!reviewId) {
      return new Response(JSON.stringify({ error: "reviewId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("id, org_id, rating, content")
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      return new Response(JSON.stringify({ error: reviewError?.message ?? "Review not found" }), {
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const sentiment = inferSentiment(Number(review.rating));

    const { error } = await supabase.from("review_analysis").upsert({
      review_id: review.id,
      org_id: review.org_id,
      sentiment_label: sentiment.label,
      sentiment_score: sentiment.score,
      themes: [],
      summary: review.content ? String(review.content).slice(0, 220) : null,
      generated_at: new Date().toISOString(),
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, sentiment: sentiment.label }), {
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
