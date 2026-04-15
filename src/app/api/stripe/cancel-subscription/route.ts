import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Stripe secret key is missing" }, { status: 500 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    if (profile.role !== "owner") {
      return NextResponse.json({ error: "Only owner can manage billing" }, { status: 403 });
    }

    const { data: subscriptionRow, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("id, provider_subscription_id, status, plan")
      .eq("org_id", profile.org_id)
      .maybeSingle();

    if (subscriptionError || !subscriptionRow?.provider_subscription_id) {
      return NextResponse.json({ error: "Active Stripe subscription not found" }, { status: 404 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const stripeSubscription = await stripe.subscriptions.update(
      subscriptionRow.provider_subscription_id,
      { cancel_at_period_end: true },
    );

    const renewTimestamp = stripeSubscription.items.data[0]?.current_period_end;
    const renewsAt = renewTimestamp ? new Date(renewTimestamp * 1000).toISOString() : null;

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "cancel_at_period_end",
        renews_at: renewsAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionRow.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, renewsAt });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
