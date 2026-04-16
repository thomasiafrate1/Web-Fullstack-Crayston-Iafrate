"use server";

// Initialisation de la librairie Resend pour l'envoi d'emails
import { resend } from "@/lib/resend";

// Endpoint pour envoyer un email de support aux administrateurs
export async function sendSupportEmailAction(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  // Tentative d'envoi avec gestion d'erreur
  try {
    // Construction et envoi de l'email formaté avec les données du formulaire
    const res = await resend.emails.send({
      from: "noreply@resend.dev",
      to: "matt.crayston@ynov.com",
      subject: `Support: ${data.subject}`,
      html: `
        <h2>Nouveau message de support</h2>
        <p><strong>De:</strong> ${data.name} (${data.email})</p>
        <p><strong>Sujet:</strong> ${data.subject}</p>
        <hr />
        <p>${data.message.replace(/\n/g, "<br />")}</p>
      `,
    });

    // Retour du succès avec confirmation
    console.log("EMAIL SUPPORT ENVOYE:", res);
    return { ok: true, message: "Ton message a été envoyé au support ✓" };
  } catch (err) {
    // Gestion des erreurs et notification à l'utilisateur
    console.error("ERREUR ENVOI SUPPORT:", err);
    return { ok: false, message: "Erreur lors de l'envoi du message" };
  }
}
