import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const event = JSON.parse(await req.text());

    console.log("🔥 WEBHOOK:", event.type);

    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ ok: true });
    }

    const session = event.data.object;

    const userId = session.metadata?.userId;
    const orgId = session.metadata?.orgId;
    const plan = session.metadata?.plan;

    console.log("🧾 METADATA:", session.metadata);

    if (!userId || !orgId || !plan) {
      console.log("❌ missing metadata");
      return NextResponse.json({ ok: true });
    }

    const subscriptionId = session.subscription;

    if (!subscriptionId) {
      console.log("❌ no subscription id");
      return NextResponse.json({ ok: true });
    }

    const subscription =
      await stripe.subscriptions.retrieve(subscriptionId);

    const renewsAt =
      subscription.items.data[0]?.current_period_end;

    const { error } = await supabase
      .from("subscriptions")
      .upsert({
        org_id: orgId,
        plan,
        status: "active",
        provider: "stripe",
        provider_subscription_id: subscription.id,
        renews_at: new Date(renewsAt * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.log("❌ SUPABASE ERROR:", error);
    } else {
      console.log("💾 SUBSCRIPTION SAVED");
    }

    await supabase
      .from("profiles")
      .update({ role: plan === "pro" ? "pro" : "member" })
      .eq("id", userId);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}