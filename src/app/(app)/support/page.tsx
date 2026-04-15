import SupportForm from "@/components/support/support-form";

export default function SupportPage() {
  return (
    <div className="space-y-6">
      {/* Titre et description */}
      <header>
        <h1 className="rf-page-title text-3xl font-semibold">Support</h1>
        <p className="rf-subtitle mt-2">
          Besoin d'aide ? On est là pour toi 👋
        </p>
      </header>

      {/* Formulaire de contact */}
      <section className="rf-card p-6 max-w-2xl">
        <div className="mb-6">
          <h2 className="rf-section-title text-xl font-semibold">
            Envoie-nous un message
          </h2>
          <p className="mt-2 text-gray-500">
            Remplis le formulaire et on te répondra au plus vite
          </p>
        </div>

        <SupportForm />
      </section>

      {/* FAQ ou infos supplémentaires */}
      <section className="rf-card p-6">
        <h2 className="rf-section-title text-xl font-semibold mb-4">
          Questions fréquentes
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900">Comment puis-je accéder à mon compte ?</h3>
            <p className="mt-1 text-sm text-gray-600">
              Utilise la page de connexion avec ton email et ton mot de passe.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">Combien de temps avant une réponse ?</h3>
            <p className="mt-1 text-sm text-gray-600">
              On répond généralement dans les 24h ouvrables.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">Puis-je annuler mon abonnement ?</h3>
            <p className="mt-1 text-sm text-gray-600">
              Oui, tu peux le faire depuis la page Facturation ou via le portail Stripe.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
