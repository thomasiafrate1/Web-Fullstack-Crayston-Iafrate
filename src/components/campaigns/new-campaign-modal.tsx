"use client";

import { useState, useTransition } from "react";
import { createCampaignAction } from "@/actions/campaigns";

export const NewCampaignModal = () => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      setError(null);

      const recipients = formData.get("recipients") as string;

      // 🔥 VALIDATION EMAILS (simple mais efficace)
      if (recipients) {
        const emails = recipients
          .split(/[\n,;]/)
          .map((e) => e.trim())
          .filter(Boolean);

        const invalid = emails.find(
          (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        );

        if (invalid) {
          setError(`Email invalide: ${invalid}`);
          return;
        }
      }

      const result = await createCampaignAction(formData);

      if (!result.ok) {
        setError(result.error ?? "Creation campagne impossible.");
        return;
      }

      // 🔥 reset + UX clean
      setOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        className="rf-btn rf-btn-primary"
        onClick={() => setOpen(true)}
      >
        + Nouvelle campagne
      </button>

      {open ? (
        <div
          className="rf-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Nouvelle campagne"
        >
          <div className="rf-modal-panel">
            <div className="rf-modal-header">
              <h2 className="rf-section-title text-lg">
                Nouvelle campagne
              </h2>

              <button
                type="button"
                className="rf-btn rf-btn-outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Fermer
              </button>
            </div>

            <form action={onSubmit} className="mt-4 grid gap-4">
              
              {/* INFOS */}
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="rf-label">
                    Nom
                  </label>
                  <input
                    name="name"
                    className="rf-input"
                    placeholder="Campagne post-visite Avril"
                    required
                  />
                </div>

                <div>
                  <label className="rf-label">
                    Sujet email
                  </label>
                  <input
                    name="subject"
                    className="rf-input"
                    placeholder="Votre avis compte pour nous"
                    required
                  />
                </div>
              </div>

              {/* TEMPLATE */}
              <div>
                <label className="rf-label">
                  Message
                </label>
                <textarea
                  name="template"
                  className="rf-textarea"
                  rows={5}
                  placeholder="Bonjour {{email}}, peux-tu laisser un avis ?"
                  required
                />
              </div>

              {/* RECIPIENTS */}
              <div>
                <label className="rf-label">
                  Destinataires (optionnel)
                </label>

                <textarea
                  name="recipients"
                  className="rf-textarea"
                  rows={4}
                  placeholder={`email1@gmail.com
email2@gmail.com
ou séparés par ,`}
                />

                <p className="text-xs text-gray-500 mt-1">
                  Tu peux ajouter plusieurs emails (virgule, ligne ou ;)
                </p>
              </div>

              {/* ERROR */}
              {error && (
                <p className="rounded-md border border-[#6d2635] bg-[#22131a] px-3 py-2 text-sm text-[#ff9bac]">
                  {error}
                </p>
              )}

              {/* ACTIONS */}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rf-btn rf-btn-outline"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="rf-btn rf-btn-primary"
                  disabled={isPending}
                >
                  {isPending ? "Création..." : "Créer la campagne"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};