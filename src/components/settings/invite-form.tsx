"use client";

import { useState, useTransition } from "react";

import { inviteMemberAction } from "@/actions/settings";
import type { AppRole } from "@/types/database";

type InviteFormProps = {
  actorRole: AppRole;
};

export const InviteForm = ({ actorRole }: InviteFormProps) => {
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
        setFeedback(`Invitation creee. Lien: ${result.inviteLink}`);
      } else {
        setFeedback("Invitation creee.");
      }
    });
  };

  return (
    <form action={onSubmit} className="space-y-3">
      <div>
        <label className="rf-label" htmlFor="inviteEmail">
          Email
        </label>
        <input id="inviteEmail" name="email" type="email" required className="rf-input" />
      </div>
      <div>
        <label className="rf-label" htmlFor="inviteRole">
          Role
        </label>
        <select
          id="inviteRole"
          name="role"
          className="rf-select"
          defaultValue="member"
          disabled={actorRole === "member"}
        >
          <option value="member">member</option>
          {actorRole === "owner" ? <option value="admin">admin</option> : null}
        </select>
      </div>
      <button type="submit" className="rf-btn rf-btn-primary" disabled={isPending}>
        {isPending ? "Envoi..." : "Inviter"}
      </button>
      {feedback ? (
        <p className="rounded-md border border-[#bde4cb] bg-[#f3fbf7] px-3 py-2 text-xs text-[var(--success-500)]">
          {feedback}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-[#efc3c0] bg-[#fff4f4] px-3 py-2 text-xs text-[var(--danger-500)]">
          {error}
        </p>
      ) : null}
    </form>
  );
};
