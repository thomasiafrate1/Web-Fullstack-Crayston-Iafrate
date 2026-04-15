"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CancelSubscriptionButtonProps = {
  renewsAt: string | null;
  cancellationScheduled: boolean;
};

const formatRenewDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

export const CancelSubscriptionButton = ({
  renewsAt,
  cancellationScheduled,
}: CancelSubscriptionButtonProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renewLabel = useMemo(() => formatRenewDate(renewsAt), [renewsAt]);

  const onConfirm = async () => {
    try {
      setIsPending(true);
      setError(null);

      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Impossible de programmer la resiliation.");
      }

      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setIsPending(false);
    }
  };

  if (cancellationScheduled) {
    return (
      <button className="rf-btn rf-btn-outline cursor-not-allowed opacity-70" disabled>
        Resiliation programmee
      </button>
    );
  }

  return (
    <>
      <button className="rf-btn rf-btn-outline cursor-pointer" onClick={() => setOpen(true)}>
        Se desabonner
      </button>

      {open ? (
        <div className="rf-modal-overlay" role="dialog" aria-modal="true" aria-label="Resiliation abonnement">
          <div className="rf-modal-panel max-w-lg">
            <h2 className="rf-section-title text-lg">Confirmer la resiliation</h2>
            <p className="mt-3 text-sm text-[var(--rf-text-muted)]">
              Votre abonnement restera actif jusqu&apos;au {renewLabel ?? "prochain renouvellement"}.
            </p>
            <p className="mt-2 text-sm text-[var(--rf-text-muted)]">
              Apres cette date, votre plan passera automatiquement en gratuit.
            </p>

            {error ? (
              <p className="mt-4 rounded-md border border-[#6d2635] bg-[#22131a] px-3 py-2 text-sm text-[#ff9bac]">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Annuler
              </button>
              <button
                type="button"
                className="rounded-md border border-red-700 bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={onConfirm}
                disabled={isPending}
              >
                {isPending ? "Validation..." : "Valider"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
