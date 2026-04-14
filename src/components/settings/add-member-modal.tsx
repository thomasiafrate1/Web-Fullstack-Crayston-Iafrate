"use client";

import { useState, useTransition } from "react";

import { inviteMemberAction } from "@/actions/settings";
import type { AppRole } from "@/types/database";

type AddMemberModalProps = {
  actorRole: AppRole;
};

export const AddMemberModal = ({ actorRole }: AddMemberModalProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      setFeedback(null);
      setError(null);
      const result = await inviteMemberAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Invitation impossible.");
        return;
      }
      if (result.inviteLink) {
        setFeedback(`Invitation creee: ${result.inviteLink}`);
      } else {
        setFeedback("Invitation creee.");
      }
    });
  };

  return (
    <>
      <button type="button" className="rf-btn rf-btn-primary" onClick={() => setOpen(true)}>
        Ajouter un membre
      </button>

      {open ? (
        <div className="rf-modal-overlay" role="dialog" aria-modal="true" aria-label="Ajouter un membre">
          <div className="rf-modal-panel">
            <div className="rf-modal-header">
              <h2 className="rf-section-title text-lg">Ajouter un membre</h2>
              <button
                type="button"
                className="rf-btn rf-btn-outline"
                onClick={() => {
                  setOpen(false);
                  setError(null);
                  setFeedback(null);
                }}
                disabled={isPending}
              >
                Fermer
              </button>
            </div>

            <form action={onSubmit} className="mt-4 space-y-3">
              <div>
                <label className="rf-label" htmlFor="memberEmailModal">
                  Email
                </label>
                <input
                  id="memberEmailModal"
                  name="email"
                  type="email"
                  className="rf-input"
                  placeholder="membre@entreprise.fr"
                  required
                />
              </div>
              <div>
                <label className="rf-label" htmlFor="memberRoleModal">
                  Role
                </label>
                <select
                  id="memberRoleModal"
                  name="role"
                  className="rf-select"
                  defaultValue="member"
                  disabled={actorRole === "member"}
                >
                  <option value="member">member</option>
                  {actorRole === "owner" ? <option value="admin">admin</option> : null}
                </select>
              </div>

              {feedback ? (
                <p className="rounded-md border border-[#1f6243] bg-[#0f2119] px-3 py-2 text-sm text-[#7cf0b4]">
                  {feedback}
                </p>
              ) : null}
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
                  {isPending ? "Envoi..." : "Inviter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};
