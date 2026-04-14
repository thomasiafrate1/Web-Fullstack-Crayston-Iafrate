"use client";

import { useState, useTransition } from "react";

import { createContactAction } from "@/actions/contacts";

export const NewContactModal = () => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      setError(null);
      const result = await createContactAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Creation du contact impossible.");
        return;
      }
      setOpen(false);
    });
  };

  return (
    <>
      <button type="button" className="rf-btn rf-btn-primary" onClick={() => setOpen(true)}>
        Ajouter un contact
      </button>

      {open ? (
        <div className="rf-modal-overlay" role="dialog" aria-modal="true" aria-label="Ajouter un contact">
          <div className="rf-modal-panel">
            <div className="rf-modal-header">
              <h2 className="rf-section-title text-lg">Ajouter un contact</h2>
              <button
                type="button"
                className="rf-btn rf-btn-outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Fermer
              </button>
            </div>

            <form action={onSubmit} className="mt-4 space-y-3">
              <div>
                <label className="rf-label" htmlFor="contactEmailModal">
                  Email
                </label>
                <input
                  id="contactEmailModal"
                  name="email"
                  type="email"
                  className="rf-input"
                  placeholder="client@entreprise.fr"
                  required
                />
              </div>
              <div>
                <label className="rf-label" htmlFor="contactNameModal">
                  Nom complet
                </label>
                <input
                  id="contactNameModal"
                  name="fullName"
                  className="rf-input"
                  placeholder="Marie Dupont"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="rf-label" htmlFor="contactPhoneModal">
                    Telephone
                  </label>
                  <input id="contactPhoneModal" name="phone" className="rf-input" placeholder="0600000000" />
                </div>
                <div>
                  <label className="rf-label" htmlFor="contactCompanyModal">
                    Entreprise
                  </label>
                  <input
                    id="contactCompanyModal"
                    name="company"
                    className="rf-input"
                    placeholder="ReviewFlow"
                  />
                </div>
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
                  {isPending ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};
