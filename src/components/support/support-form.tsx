"use client";

import { useState, useTransition } from "react";
import { sendSupportEmailAction } from "@/actions/support";

export default function SupportForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [responseMessage, setResponseMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResponseMessage(null);

    // Validation basique
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setResponseMessage({ type: "error", text: "Tous les champs sont obligatoires" });
      return;
    }

    startTransition(async () => {
      const result = await sendSupportEmailAction({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      if (result.ok) {
        setResponseMessage({ type: "success", text: result.message });
        // Réinitialiser le formulaire
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      } else {
        setResponseMessage({ type: "error", text: result.message });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Message de réponse */}
      {responseMessage && (
        <div
          className={`p-4 rounded-lg ${
            responseMessage.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {responseMessage.text}
        </div>
      )}

      {/* Champs du formulaire */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ton nom
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="Jean Dupont"
          disabled={isPending}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ton email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="jean@example.com"
          disabled={isPending}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sujet
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="Mon problème ou ma question"
          disabled={isPending}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          placeholder="Décris ton problème en détail..."
          disabled={isPending}
        />
      </div>

      {/* Bouton d'envoi */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rf-btn bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Envoi en cours..." : "Envoyer le message"}
      </button>
    </form>
  );
}
