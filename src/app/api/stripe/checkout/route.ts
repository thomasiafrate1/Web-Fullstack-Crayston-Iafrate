import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { plan, userId } = await req.json();

    // 🎯 choix du produit Stripe
    const priceId =
      plan === "pro"
        ? process.env.STRIPE_PRICE_PRO
        : null;

    if (!priceId) {
      return NextResponse.json(
        { error: "Plan invalide ou priceId manquant" },
        { status: 400 }
      );
    }

    // 💳 création session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      payment_method_types: ["card"],

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      // 🍎 Apple Pay inclus automatiquement par Stripe Checkout

      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/facturation`,

      metadata: {
        userId,
        plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe error:", error);

    return NextResponse.json(
      { error: error.message || "Stripe error" },
      { status: 500 }
    );
  }
}