"use client";

// On importe les hooks React et l'action serveur pour envoyer l'email
import { useState, useTransition } from "react";
import { sendSupportEmailAction } from "@/actions/support";

export default function SupportForm() {
  // On gère l'état de tous les champs du formulaire et le status de l'envoi
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [responseMessage, setResponseMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // On traite l'envoi du formulaire avec validation et appel à l'action serveur
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResponseMessage(null);

    // On vérifie que tous les champs sont remplis
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setResponseMessage({ type: "error", text: "Tous les champs sont obligatoires" });
      return;
    }

    // On envoie les données au serveur et on gère la réponse
    startTransition(async () => {
      const result = await sendSupportEmailAction({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      // Si succès, on affiche le message et on réinitialise le formulaire
      if (result.ok) {
        setResponseMessage({ type: "success", text: result.message });
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      } else {
        setResponseMessage({ type: "error", text: result.message });
      }
    });
  };

  // On retourne le formulaire avec tous les champs et le message de réponse
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* On affiche le message de succès ou d'erreur si présent */}
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

      {/* Champ pour le nom de l'utilisateur */}
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

      {/* Champ pour l'email de contact */}
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

      {/* Champ pour le sujet du message */}
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

      {/* Champ textarea pour le message détaillé */}
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

      {/* Bouton pour envoyer le formulaire avec état de chargement */}
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
