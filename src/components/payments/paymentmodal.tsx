"use client";

// On importe Framer Motion, l'icone de fermeture et les hooks React.
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

// On definit les props necessaires pour afficher et lancer le paiement.
type Props = {
  open: boolean;
  onClose: () => void;
  plan: string | null;
  userId: string;
  orgId: string;
};

export default function PaymentModal({ open, onClose, plan, userId, orgId }: Props) {
  // On gere la position du bouton close et l'etat de chargement du paiement.
  const [escapePos, setEscapePos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  // On remet la position du bouton close a zero a chaque ouverture de la modale.
  useEffect(() => {
    if (open) setEscapePos({ x: 0, y: 0 });
  }, [open]);

  // On ne rend rien tant que la modale est fermee.
  if (!open) return null;

  // On securise le plan accepte et le prix affiche.
  const safePlan = plan === "pro" ? "pro" : null;
  const price = safePlan === "pro" ? "24.99 EUR" : "0 EUR";

  // On cree la session Stripe checkout puis on redirige l'utilisateur.
  const handlePay = async () => {
    try {
      if (!safePlan) {
        console.error("Invalid plan");
        return;
      }

      setLoading(true);

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: safePlan,
          userId,
          orgId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Checkout error:", data.error);
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Payment error:", err);
      setLoading(false);
    }
  };

  return (
    // On affiche un overlay plein ecran pour isoler la modale.
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* On anime un fond floute pour renforcer la mise au focus. */}
      <motion.div
        className="absolute inset-0 bg-black/10 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* On anime l'apparition du panneau principal avec un effet spring. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 16 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-xl"
      >
        {/* On ajoute une lueur decorative animee a gauche. */}
        <motion.div
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        {/* On ajoute une seconde lueur decorative animee a droite. */}
        <motion.div
          className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        {/* On affiche l'entete de la modale avec le plan choisi. */}
        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-900">Finaliser votre abonnement</h2>
          <p className="mt-2 text-gray-600">
            Plan : <span className="font-semibold capitalize">{safePlan || "invalide"}</span>
          </p>
        </div>

        {/* On affiche le prix, les benefices et le bouton de paiement. */}
        <div className="space-y-8 px-8 pb-8">
          <div className="text-5xl font-extrabold text-gray-900">
            {price}
            <span className="ml-2 text-lg font-medium text-gray-500">/ mois</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
            <div>+ Avis illimites</div>
            <div>+ Analyse avancee</div>
            <div>+ Export CSV</div>
            <div>+ Support prioritaire</div>
          </div>

          {/* On lance le checkout Stripe avec une micro animation au hover/click. */}
          <motion.button
            onClick={handlePay}
            disabled={loading || !safePlan}
            whileHover={{
              scale: 1.02,
              boxShadow: "0px 10px 30px rgba(124,58,237,0.25)",
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-4 text-lg font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Redirection..." : "Payer maintenant"}
          </motion.button>
        </div>

        {/* On garde un bouton close fun qui bouge legerement a la souris. */}
        <motion.button
          className="absolute right-5 top-5 cursor-pointer text-gray-500"
          animate={{ x: escapePos.x, y: escapePos.y }}
          transition={{ type: "spring", stiffness: 140 }}
          onMouseMove={() =>
            setEscapePos({
              x: Math.random() * 60 - 30,
              y: Math.random() * 60 - 30,
            })
          }
          onClick={onClose}
        >
          <X size={22} />
        </motion.button>
      </motion.div>
    </div>
  );
}
