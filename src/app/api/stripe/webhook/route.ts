import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

// Helper pour extraire la date de renouvellement depuis une souscription Stripe
const toRenewDate = (subscription: Stripe.Subscription) => {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
};

const resolveEvent = (
  stripe: Stripe,
  rawBody: string,
  signature: string | null,
  webhookSecret: string | undefined,
) => {
  if (webhookSecret && signature) {
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }
  return JSON.parse(rawBody) as Stripe.Event;
};

const syncBillingState = async (params: {
  supabase: any;
  orgId: string;
  providerSubscriptionId: string;
  plan: "free" | "pro";
  status: string;
  renewsAt: string | null;
}) => {
  const { supabase, orgId, providerSubscriptionId, plan, status, renewsAt } = params;

  const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
    {
      org_id: orgId,
      plan,
      status,
      provider: "stripe",
      provider_subscription_id: providerSubscriptionId,
      renews_at: renewsAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id" },
  );

  if (subscriptionError) {
    return { error: subscriptionError.message };
  }

  const { error: orgError } = await supabase
    .from("organizations")
    .update({
      plan,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);

  if (orgError) {
    return { error: orgError.message };
  }

  return { error: null };
};

export async function POST(req: Request) {
  try {
    // Initialisation des clients Stripe et Supabase pour le traitement du webhook
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Stripe/Supabase environment variables are missing" },
        { status: 500 },
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
    const db = supabase as any;

    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");
    const event = resolveEvent(stripe, rawBody, signature, stripeWebhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const orgId = session.metadata?.orgId;
      const plan = session.metadata?.plan === "pro" ? "pro" : "free";
      const subscriptionId = session.subscription;

      if (!userId || !orgId || !subscriptionId || typeof subscriptionId !== "string") {
        return NextResponse.json({ ok: true });
      }

      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      const renewsAt = toRenewDate(stripeSubscription);
      const status = stripeSubscription.cancel_at_period_end ? "cancel_at_period_end" : "active";

      const { error } = await syncBillingState({
        supabase: db,
        orgId,
        providerSubscriptionId: stripeSubscription.id,
        plan,
        status,
        renewsAt,
      });

      if (error) {
        return NextResponse.json({ error }, { status: 500 });
      }

      await db
        .from("profiles")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", userId);

      return NextResponse.json({ ok: true });
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const stripeSubscription = event.data.object as Stripe.Subscription;

      const { data: row } = await db
        .from("subscriptions")
        .select("org_id")
        .eq("provider_subscription_id", stripeSubscription.id)
        .maybeSingle();

      const metadataOrgId = stripeSubscription.metadata?.orgId || stripeSubscription.metadata?.org_id;
      const orgId = row?.org_id ?? metadataOrgId ?? null;

      if (!orgId) {
        return NextResponse.json({ ok: true });
      }

      const canceled =
        event.type === "customer.subscription.deleted" || stripeSubscription.status === "canceled";
      const plan: "free" | "pro" = canceled ? "free" : "pro";
      const status = canceled
        ? "canceled"
        : stripeSubscription.cancel_at_period_end
          ? "cancel_at_period_end"
          : "active";
      const renewsAt = canceled ? null : toRenewDate(stripeSubscription);

      const { error } = await syncBillingState({
        supabase: db,
        orgId,
        providerSubscriptionId: stripeSubscription.id,
        plan,
        status,
        renewsAt,
      });

      if (error) {
        return NextResponse.json({ error }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
