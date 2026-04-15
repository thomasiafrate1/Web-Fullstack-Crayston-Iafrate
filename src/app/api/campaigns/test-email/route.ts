import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json(
        { error: "Resend API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: email,
        subject: "🧪 Test Email de Campagne",
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px;">
                <h1 style="color: #1f2937; margin-bottom: 16px;">🧪 Email de Test</h1>
                <p style="color: #4b5563; line-height: 1.6;">
                  Ceci est un email de test envoyé depuis votre système de campagnes.
                </p>
                <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 12px; margin: 16px 0; border-radius: 4px;">
                  <p style="color: #1e40af; font-size: 14px; margin: 0;">
                    ✅ Si vous voyez ce message, votre configuration d'email est correcte !
                  </p>
                </div>
                <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                  Envoyé le ${new Date().toLocaleString("fr-FR")}
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || "Failed to send email" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ ok: true, messageId: data.id });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
