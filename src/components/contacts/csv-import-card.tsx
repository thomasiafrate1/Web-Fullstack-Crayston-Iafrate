"use client";

import { useRef, useState, useTransition } from "react";

import { importContactsCsvAction } from "@/actions/contacts";

export const CsvImportCard = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSelectFile = () => {
    inputRef.current?.click();
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setFeedback(null);
    setError(null);
  };

  const onImport = () => {
    if (!selectedFile) {
      setError("Choisissez un fichier CSV avant l'import.");
      return;
    }

    startTransition(async () => {
      setFeedback(null);
      setError(null);

      try {
        const csv = await selectedFile.text();
        const formData = new FormData();
        formData.set("csv", csv);
        const result = await importContactsCsvAction(formData);

        if (!result.ok) {
          setError(result.error ?? "Import CSV impossible.");
          return;
        }

        setFeedback("Import termine.");
        setSelectedFile(null);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      } catch {
        setError("Impossible de lire le fichier.");
      }
    });
  };

  return (
    <article className="rf-card p-5">
      <h2 className="rf-section-title">Importer CSV</h2>
      <p className="mt-2 text-sm text-[var(--rf-text-muted)]">
        Format attendu: email,nom,telephone,entreprise
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" className="rf-btn rf-btn-outline" onClick={onSelectFile}>
          Ouvrir les fichiers
        </button>
        <button type="button" className="rf-btn rf-btn-primary" onClick={onImport} disabled={isPending}>
          {isPending ? "Import..." : "Importer"}
        </button>
      </div>

      <p className="mt-3 text-sm text-[var(--rf-text-muted)]">
        {selectedFile ? `Fichier choisi: ${selectedFile.name}` : "Aucun fichier selectionne."}
      </p>

      {feedback ? (
        <p className="mt-3 rounded-md border border-[#1f6243] bg-[#0f2119] px-3 py-2 text-sm text-[#7cf0b4]">
          {feedback}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-md border border-[#6d2635] bg-[#22131a] px-3 py-2 text-sm text-[#ff9bac]">
          {error}
        </p>
      ) : null}
    </article>
  );
};
