import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createClient } from "@/lib/supabase/server";

// Annule l'abonnement Stripe actif à la fin de la période (accès propriétaire uniquement)
export async function POST() {
  try {
    // Validation de la configuration de la clé API Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Stripe secret key is missing" }, { status: 500 });
    }

    // Récupération de l'utilisateur authentifié depuis la session
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Récupération du profil utilisateur avec infos organisation et rôle
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // Vérification que seul le propriétaire peut gérer l'abonnement
    if (profile.role !== "owner") {
      return NextResponse.json({ error: "Only owner can manage billing" }, { status: 403 });
    }

    // Récupération de l'abonnement actif de l'organisation
    const { data: subscriptionRow, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("id, provider_subscription_id, status, plan")
      .eq("org_id", profile.org_id)
      .maybeSingle();

    if (subscriptionError || !subscriptionRow?.provider_subscription_id) {
      return NextResponse.json({ error: "Active Stripe subscription not found" }, { status: 404 });
    }

    // Mise à jour de l'abonnement Stripe pour annulation à fin de période
    const stripe = new Stripe(stripeSecretKey);
    const stripeSubscription = await stripe.subscriptions.update(
      subscriptionRow.provider_subscription_id,
      { cancel_at_period_end: true },
    );

    // Extraction de la date de renouvellement depuis la fin de période Stripe
    const renewTimestamp = stripeSubscription.items.data[0]?.current_period_end;
    const renewsAt = renewTimestamp ? new Date(renewTimestamp * 1000).toISOString() : null;

    // Synchronisation de l'état d'annulation en base de données avec date de renouvellement
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

    // Retour du succès avec date de renouvellement
    return NextResponse.json({ ok: true, renewsAt });
  } catch (e) {
    // Gestion et retour du message d'erreur
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
