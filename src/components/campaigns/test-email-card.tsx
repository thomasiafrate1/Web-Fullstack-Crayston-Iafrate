"use client";

import { useState } from "react";

export function TestEmailCard() {
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSendTest = async () => {
    if (!testEmail) {
      setMessage({ type: "error", text: "Entrez un email de test" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/campaigns/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      setMessage({ type: "success", text: `✅ Email envoyé avec succès à ${testEmail}` });
      setTestEmail("");
    } catch (error) {
      setMessage({
        type: "error",
        text: `❌ Erreur: ${error instanceof Error ? error.message : "Impossible d'envoyer l'email"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rf-card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">🧪 Test Email</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email de test
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleSendTest}
          disabled={loading || !testEmail}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
        >
          {loading ? "Envoi en cours..." : "Envoyer email de test"}
        </button>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm font-medium ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
