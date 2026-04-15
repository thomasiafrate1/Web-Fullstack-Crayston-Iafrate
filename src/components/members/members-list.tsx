"use client";

import { useState, useTransition, useMemo } from "react";
import { deleteMemberAction } from "@/actions/members";
import { formatDate } from "@/lib/utils";
import type { TableRow } from "@/types/database";

type Member = TableRow<"profiles"> & {
  organizations?: {
    name: string;
  } | null;
};

type MembersListProps = {
  members: Member[];
};

export default function MembersList({ members }: MembersListProps) {
  // On gère l'état de la recherche et de la pop-up de suppression
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // On filtre les membres en fonction du terme de recherche sur le nom ou l'email
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const name = (member.full_name || "").toLowerCase();
      const email = (member.email || "").toLowerCase();
      const term = searchTerm.toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [members, searchTerm]);

  // On traite la suppression d'un membre avec confirmation
  const handleDeleteMember = (member: Member) => {
    setMemberToDelete(member);
    setDeleteMessage(null);
  };

  // On confirme et envoie la suppression au serveur
  const confirmDelete = () => {
    if (!memberToDelete) return;

    startTransition(async () => {
      const result = await deleteMemberAction(memberToDelete.id);

      if (result.ok) {
        setDeleteMessage({ type: "success", text: result.message });
        // On rafraîchit la page pour mettre à jour la liste après 500ms
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setDeleteMessage({ type: "error", text: result.message });
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche pour filtrer par pseudo */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Recherche par pseudo..."
          className="flex-1 px-3 py-2 border border-gray-900 rounded-lg bg-gray-950 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          disabled={isPending}
        />
        <span className="text-sm text-gray-400">{filteredMembers.length} membre(s)</span>
      </div>

      {/* Tableau des membres */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-950">
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Pseudo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Rôle</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">Date d'arrivée</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              // On affiche chaque membre avec ses infos et un bouton supprimer
              <tr key={member.id} className="border-b border-gray-800 bg-gray-900 hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-white">{member.full_name || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{member.email}</td>
                <td className="px-4 py-3 text-sm text-gray-400 capitalize">{member.role}</td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {member.created_at ? formatDate(member.created_at) : "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDeleteMember(member)}
                    disabled={isPending}
                    className="px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Message quand aucun membre ne correspond à la recherche */}
        {filteredMembers.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            Aucun membre trouvé avec ce pseudo
          </div>
        )}
      </div>

      {/* Pop-up de confirmation de suppression */}
      {memberToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm shadow-lg">
            {/* Message de confirmation ou erreur */}
            {deleteMessage ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${
                    deleteMessage.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {deleteMessage.text}
                </div>
                <button
                  onClick={() => setMemberToDelete(null)}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              // Demande de confirmation avant suppression
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
                <p className="text-gray-600">
                  Êtes-vous sûr de vouloir supprimer{" "}
                  <strong>{memberToDelete.full_name || memberToDelete.email}</strong> de
                  l'organisation ?
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setMemberToDelete(null)}
                    disabled={isPending}
                    className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isPending}
                    className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? "Suppression..." : "Supprimer"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
