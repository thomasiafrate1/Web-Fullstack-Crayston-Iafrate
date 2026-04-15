import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Stripe/Supabase environment variables are missing" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const event = JSON.parse(await req.text());

    console.log("WEBHOOK:", event.type);

    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ ok: true });
    }

    const session = event.data.object;

    const userId = session.metadata?.userId;
    const orgId = session.metadata?.orgId;
    const plan = session.metadata?.plan;

    console.log("METADATA:", session.metadata);

    if (!userId || !orgId || !plan) {
      console.log("Missing metadata");
      return NextResponse.json({ ok: true });
    }

    const subscriptionId = session.subscription;

    if (!subscriptionId || typeof subscriptionId !== "string") {
      console.log("No subscription id");
      return NextResponse.json({ ok: true });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const renewsAt = subscription.items.data[0]?.current_period_end;

    const { error } = await supabase
      .from("subscriptions")
      .upsert({
        org_id: orgId,
        plan,
        status: "active",
        provider: "stripe",
        provider_subscription_id: subscription.id,
        renews_at: renewsAt ? new Date(renewsAt * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.log("SUPABASE ERROR:", error);
    } else {
      console.log("SUBSCRIPTION SAVED");
    }

    await supabase
      .from("profiles")
      .update({ role: plan === "pro" ? "pro" : "member" })
      .eq("id", userId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
