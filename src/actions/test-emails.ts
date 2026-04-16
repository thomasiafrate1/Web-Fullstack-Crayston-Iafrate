"use server";

// Initialisation de Resend pour les tests d'envoi
import { resend } from "@/lib/resend";

// Action pour tester que le service Resend fonctionne correctement
export async function testEmailAction() {
  // Tentative d'envoi d'un email de test
  try {
    // Envoi d'un email de vérification
    const res = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "tonemail@gmail.com",
      subject: "Test Resend",
      html: "<p>Si tu vois ce message, Resend fonctionne.</p>",
    });

    // Confirmation de l'envoi
    console.log("EMAIL ENVOYE:", res);
    return { ok: true };
  } catch (err) {
    // Gestion des erreurs lors de l'envoi
    console.error("ERREUR RESEND:", err);
    return { ok: false };
  }
}
