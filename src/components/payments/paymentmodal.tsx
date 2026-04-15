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

export default function PaymentModal({
  open,
  onClose,
  plan,
  userId,
  orgId,
}: Props) {
  const [escapePos, setEscapePos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setEscapePos({ x: 0, y: 0 });
  }, [open]);

  if (!open) return null;

  // 🔥 SÉCURITÉ PLAN (IMPORTANT)
  const safePlan = plan === "pro" ? "pro" : null;

  const price = safePlan === "pro" ? "24.99€" : "0€";

  const handlePay = async () => {
    try {
      if (!safePlan) {
        console.error("❌ INVALID PLAN FRONT");
        return;
      }

      setLoading(true);

      console.log("🚀 CHECKOUT START:", {
        plan: safePlan,
        userId,
        orgId,
      });

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: safePlan, // ✅ toujours "pro"
          userId,
          orgId,
        }),
      });

      const data = await res.json();

      console.log("📦 CHECKOUT RESPONSE:", data);

      if (!res.ok) {
        console.error("❌ CHECKOUT ERROR:", data.error);
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("❌ PAYMENT ERROR:", err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* BACKDROP */}
      <motion.div
        className="absolute inset-0 backdrop-blur-[3px] bg-black/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* MODAL */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 16 }}
        className="relative w-full max-w-2xl rounded-3xl border border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        {/* GLOW */}
        <motion.div
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <motion.div
          className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        {/* HEADER */}
        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Finaliser ton abonnement
          </h2>

          <p className="mt-2 text-gray-600">
            Plan :{" "}
            <span className="font-semibold capitalize">
              {safePlan || "invalide"}
            </span>
          </p>
        </div>

        {/* CONTENT */}
        <div className="px-8 pb-8 space-y-8">
          {/* PRICE */}
          <div className="text-5xl font-extrabold text-gray-900">
            {price}
            <span className="text-lg font-medium text-gray-500 ml-2">
              / mois
            </span>
          </div>

          {/* FEATURES */}
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
            <div>✔ Avis illimités</div>
            <div>✔ Analyse avancée</div>
            <div>✔ Export CSV</div>
            <div>✔ Support prioritaire</div>
          </div>

          {/* BUTTON */}
          <motion.button
            onClick={handlePay}
            disabled={loading || !safePlan}
            whileHover={{
              scale: 1.02,
              boxShadow: "0px 10px 30px rgba(124,58,237,0.25)",
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-4 text-white font-semibold text-lg disabled:opacity-50"
          >
            {loading ? "Redirection..." : "Payer maintenant"}
          </motion.button>
        </div>

        {/* CLOSE */}
        <motion.button
          className="absolute top-5 right-5 text-gray-500 cursor-pointer"
          animate={{
            x: escapePos.x,
            y: escapePos.y,
          }}
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