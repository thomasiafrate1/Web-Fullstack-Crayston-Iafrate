import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/session";

export default async function SourcesPage() {
  const { supabase, profile } = await requireAppContext();

  const { data: sources } = await supabase
    .from("review_sources")
    .select("*")
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: false });

  const activeGoogle = sources?.find((s) => s.type === "google" && s.is_active);
  const activeWebsite = sources?.find((s) => s.type === "website" && s.is_active);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="rf-page-title text-3xl font-semibold">Sources d'avis</h1>
        <p className="rf-subtitle mt-2">Connecte Google Business ou ton site</p>
      </header>

      <section className="rf-card space-y-5 p-6">
        <div>
          <h2 className="rf-section-title">Ajouter une source</h2>
          <p className="mt-1 text-sm text-gray-400">Une seule source active par type</p>
        </div>

        <form
          action={async (formData) => {
            "use server";

            const { supabase, profile } = await requireAppContext();
            const type = formData.get("type") as string;
            const url = formData.get("url") as string;

            if (!url) return;

            await supabase
              .from("review_sources")
              .delete()
              .eq("org_id", profile.org_id)
              .eq("type", type);

            await supabase.from("review_sources").insert({
              org_id: profile.org_id,
              type,
              url,
              is_active: true,
            });

            revalidatePath("/sources");
          }}
          className="space-y-4"
        >
          <select name="type" className="rf-input w-full">
            <option value="google">Google Business</option>
            <option value="website">Site web</option>
          </select>

          <input name="url" placeholder="https://..." className="rf-input w-full" />

          <button className="rf-btn rf-btn-primary w-full">Ajouter la source</button>
        </form>
      </section>

      <section className="rf-card space-y-4 p-6">
        <h2 className="rf-section-title">Tes sources</h2>

        <div className="relative flex items-center justify-between rounded-xl border p-4">
          {activeGoogle ? (
            <span className="absolute left-2 top-2 rounded bg-green-500 px-2 py-1 text-xs text-white">
              Actif
            </span>
          ) : null}

          <div className="ml-16">
            <p className="font-semibold">Google Business</p>
            <p className="text-sm text-gray-500">{activeGoogle?.url || "Non configure"}</p>
          </div>

          {activeGoogle ? (
            <form
              action={async () => {
                "use server";

                const { supabase } = await requireAppContext();
                await supabase.from("review_sources").delete().eq("id", activeGoogle.id);
                revalidatePath("/sources");
              }}
            >
              <button className="text-sm text-red-500">Supprimer</button>
            </form>
          ) : null}
        </div>

        <div className="relative flex items-center justify-between rounded-xl border p-4">
          {activeWebsite ? (
            <span className="absolute left-2 top-2 rounded bg-green-500 px-2 py-1 text-xs text-white">
              Actif
            </span>
          ) : null}

          <div className="ml-16">
            <p className="font-semibold">Site web</p>
            <p className="text-sm text-gray-500">{activeWebsite?.url || "Non configure"}</p>
          </div>

          {activeWebsite ? (
            <form
              action={async () => {
                "use server";

                const { supabase } = await requireAppContext();
                await supabase.from("review_sources").delete().eq("id", activeWebsite.id);
                revalidatePath("/sources");
              }}
            >
              <button className="text-sm text-red-500">Supprimer</button>
            </form>
          ) : null}
        </div>
      </section>

      <section className="rf-card p-6">
        <p className="text-sm text-gray-400">
          Une seule source active par type. Ajouter une nouvelle remplace automatiquement l'ancienne.
        </p>
      </section>
    </div>
  );
}
