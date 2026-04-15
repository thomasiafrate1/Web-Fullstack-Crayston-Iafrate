"use server";

// On importe la librairie Resend pour envoyer des emails
import { resend } from "@/lib/resend";

// Cette action serveur envoie un email de support à Matt avec les données du formulaire
export async function sendSupportEmailAction(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  // On essaie d'envoyer l'email et on capture l'erreur si ça échoue
  try {
    // On utilise Resend pour envoyer l'email formaté en HTML avec tous les détails
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

    // On log et retourne un message de succès si tout s'est bien passé
    console.log("EMAIL SUPPORT ENVOYE:", res);
    return { ok: true, message: "Ton message a été envoyé au support ✓" };
  } catch (err) {
    // Si une erreur se produit, on la log et on retourne un message d'erreur
    console.error("ERREUR ENVOI SUPPORT:", err);
    return { ok: false, message: "Erreur lors de l'envoi du message" };
  }
}
