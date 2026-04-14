"use client";

import { useState } from "react";
import PaymentModal from "@/components/payments/paymentmodal";

type Props = {
  userId: string;
  plan: string;
};

export default function BillingClient({ userId, plan }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="rf-btn rf-btn-primary"
        onClick={() => setOpen(true)}
      >
        Upgrader vers Pro
      </button>

      <PaymentModal
        open={open}
        onClose={() => setOpen(false)}
        plan="pro"
        userId={userId}
      />
    </>
  );
}