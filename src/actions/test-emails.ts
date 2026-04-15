"use server";

import { resend } from "@/lib/resend";

export async function testEmailAction() {
  try {
    const res = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "tonemail@gmail.com",
      subject: "Test Resend",
      html: "<p>Si tu vois ce message, Resend fonctionne.</p>",
    });

    console.log("EMAIL ENVOYE:", res);
    return { ok: true };
  } catch (err) {
    console.error("ERREUR RESEND:", err);
    return { ok: false };
  }
}
