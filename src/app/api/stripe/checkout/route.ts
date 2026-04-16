// Initialisation des imports et de la clé Stripe secrète
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Endpoint POST qui crée une session Stripe pour le paiement d'abonnement
export async function POST(req: Request) {
  try {
    // Extraction des paramètres: plan, userId et orgId depuis la requête
    const { plan, userId, orgId } = await req.json();

    // Vérification que tous les paramètres requis sont présents
    if (!plan || !userId || !orgId) {
      return NextResponse.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    // Sélection de l'ID de prix Stripe selon le plan choisi
    const priceId =
      plan === "pro" ? process.env.STRIPE_PRICE_PRO : null;

    // Vérification que le priceId est valide
    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Création de la session Stripe avec les détails de l'abonnement
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/facturation`,

      metadata: {
        userId,
        orgId,
        plan,
      },
    });

    // Retour de l'URL de paiement Stripe au client
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    // Gestion des erreurs et retour du message d'erreur
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}