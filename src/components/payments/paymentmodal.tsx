"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  plan: string | null;
  userId: string;
  orgId: string;
};

export default function PaymentModal({ open, onClose, plan, userId, orgId }: Props) {
  const [escapePos, setEscapePos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setEscapePos({ x: 0, y: 0 });
  }, [open]);

  if (!open) return null;

  const safePlan = plan === "pro" ? "pro" : null;
  const price = safePlan === "pro" ? "24.99 EUR" : "0 EUR";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div
        className="absolute inset-0 bg-black/10 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 16 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-xl"
      >
        <motion.div
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <motion.div
          className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-900">Finaliser votre abonnement</h2>
          <p className="mt-2 text-gray-600">
            Plan : <span className="font-semibold capitalize">{safePlan || "invalide"}</span>
          </p>
        </div>

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
