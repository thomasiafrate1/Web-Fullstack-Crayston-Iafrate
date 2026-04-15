"use server";

import { resend } from "@/lib/resend";

export async function sendSupportEmailAction(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  try {
    // On envoie l'email au support
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

    console.log("EMAIL SUPPORT ENVOYE:", res);
    return { ok: true, message: "Ton message a été envoyé au support ✓" };
  } catch (err) {
    console.error("ERREUR ENVOI SUPPORT:", err);
    return { ok: false, message: "Erreur lors de l'envoi du message" };
  }
}
