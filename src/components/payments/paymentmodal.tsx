"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  plan: string | null;
  userId?: string;
};

export default function PaymentModal({ open, onClose, plan, userId }: Props) {
  const [escapePos, setEscapePos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setEscapePos({ x: 0, y: 0 });
  }, [open]);

  if (!open) return null;

  const price = plan === "pro" ? "24.99€" : "0€";

  // 💳 paiement Stripe
  const handlePay = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.error);
        setLoading(false);
        return;
      }

      // 🔁 redirection Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border"
      >
        {/* HEADER */}
        <div className="p-6 bg-gradient-to-r from-violet-500/10 to-indigo-500/10">
          <h2 className="text-2xl font-bold">
            Finaliser ton abonnement
          </h2>
          <p className="text-sm text-gray-600">
            Plan sélectionné : <strong>{plan}</strong>
          </p>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6">
          <div className="text-4xl font-bold">
            {price}
            <span className="text-sm font-normal text-gray-500 ml-2">
              / mois
            </span>
          </div>

          {/* CTA */}
          <motion.button
            onClick={handlePay}
            disabled={loading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-white font-semibold"
          >
            {loading ? "Redirection..." : "Payer avec carte / Apple Pay"}
          </motion.button>
        </div>

        {/* ❌ CROIX QUI FUIT */}
        <motion.button
          className="absolute top-4 right-4 text-gray-600"
          animate={{
            x: escapePos.x,
            y: escapePos.y,
          }}
          onMouseMove={() =>
            setEscapePos({
              x: Math.random() * 120 - 60,
              y: Math.random() * 120 - 60,
            })
          }
          onClick={onClose}
        >
          <X size={20} />
        </motion.button>
      </motion.div>
    </div>
  );
}