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
      const result = await createCampaignAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Creation campagne impossible.");
        return;
      }
      setOpen(false);
    });
  };

  return (
    <>
      <button type="button" className="rf-btn rf-btn-primary" onClick={() => setOpen(true)}>
        + Nouvelle campagne
      </button>

      {open ? (
        <div className="rf-modal-overlay" role="dialog" aria-modal="true" aria-label="Nouvelle campagne">
          <div className="rf-modal-panel">
            <div className="rf-modal-header">
              <h2 className="rf-section-title text-lg">Nouvelle campagne</h2>
              <button
                type="button"
                className="rf-btn rf-btn-outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Fermer
              </button>
            </div>

            <form action={onSubmit} className="mt-4 grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="rf-label" htmlFor="campaignNameModal">
                    Nom
                  </label>
                  <input
                    id="campaignNameModal"
                    name="name"
                    className="rf-input"
                    placeholder="Campagne post-visite Avril"
                    required
                  />
                </div>
                <div>
                  <label className="rf-label" htmlFor="campaignSubjectModal">
                    Sujet email
                  </label>
                  <input
                    id="campaignSubjectModal"
                    name="subject"
                    className="rf-input"
                    placeholder="Votre avis compte pour nous"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="rf-label" htmlFor="campaignTemplateModal">
                  Message
                </label>
                <textarea
                  id="campaignTemplateModal"
                  name="template"
                  className="rf-textarea"
                  rows={5}
                  placeholder="Bonjour {{name}}, pouvez-vous partager votre experience en 30 secondes ?"
                  required
                />
              </div>

              <div>
                <label className="rf-label" htmlFor="campaignRecipientsModal">
                  Destinataires (optionnel)
                </label>
                <textarea
                  id="campaignRecipientsModal"
                  name="recipients"
                  className="rf-textarea"
                  rows={4}
                  placeholder="mail1@example.com, mail2@example.com"
                />
              </div>

              {error ? (
                <p className="rounded-md border border-[#6d2635] bg-[#22131a] px-3 py-2 text-sm text-[#ff9bac]">
                  {error}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rf-btn rf-btn-outline"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Annuler
                </button>
                <button type="submit" className="rf-btn rf-btn-primary" disabled={isPending}>
                  {isPending ? "Creation..." : "Creer la campagne"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};
