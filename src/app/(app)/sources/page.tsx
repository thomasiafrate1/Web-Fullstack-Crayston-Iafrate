import { requireAppContext } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export default async function SourcesPage() {
  const { supabase, profile } = await requireAppContext();

  const { data: sources } = await supabase
    .from("review_sources")
    .select("*")
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: false });

  const activeGoogle = sources?.find(
    (s) => s.type === "google" && s.is_active
  );

  const activeWebsite = sources?.find(
    (s) => s.type === "website" && s.is_active
  );

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <header>
        <h1 className="rf-page-title text-3xl font-semibold">
          Sources d’avis
        </h1>
        <p className="rf-subtitle mt-2">
          Connecte Google Business ou ton site
        </p>
      </header>

      {/* ADD SOURCE */}
      <section className="rf-card p-6 space-y-5">
        <div>
          <h2 className="rf-section-title">
            Ajouter une source
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Une seule source active par type
          </p>
        </div>

        <form
          action={async (formData) => {
            "use server";

            const { supabase, profile } = await requireAppContext();

            const type = formData.get("type") as string;
            const url = formData.get("url") as string;

            if (!url) return;

            // ❌ au lieu de throw → on delete l'ancienne source
            await supabase
              .from("review_sources")
              .delete()
              .eq("org_id", profile.org_id)
              .eq("type", type);

            // ✅ insert nouvelle
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

          <input
            name="url"
            placeholder="https://..."
            className="rf-input w-full"
          />

          <button className="rf-btn rf-btn-primary w-full">
            Ajouter la source
          </button>
        </form>
      </section>

      {/* LIST */}
      <section className="rf-card p-6 space-y-4">
        <h2 className="rf-section-title">
          Tes sources
        </h2>

        {/* GOOGLE */}
        <div className="relative p-4 rounded-xl border flex justify-between items-center">

          {/* ACTIVE BADGE TOP LEFT */}
          {activeGoogle && (
            <span className="absolute top-2 left-2 px-2 py-1 text-xs rounded bg-green-500 text-white">
              Actif
            </span>
          )}

          <div className="ml-16">
            <p className="font-semibold">Google Business</p>
            <p className="text-sm text-gray-500">
              {activeGoogle?.url || "Non configuré"}
            </p>
          </div>

          {activeGoogle && (
            <form
              action={async () => {
                "use server";

                const { supabase, profile } = await requireAppContext();

                await supabase
                  .from("review_sources")
                  .delete()
                  .eq("id", activeGoogle.id);

                revalidatePath("/sources");
              }}
            >
              <button className="text-red-500 text-sm">
                Supprimer
              </button>
            </form>
          )}
        </div>

        {/* WEBSITE */}
        <div className="relative p-4 rounded-xl border flex justify-between items-center">

          {activeWebsite && (
            <span className="absolute top-2 left-2 px-2 py-1 text-xs rounded bg-green-500 text-white">
              Actif
            </span>
          )}

          <div className="ml-16">
            <p className="font-semibold">Site web</p>
            <p className="text-sm text-gray-500">
              {activeWebsite?.url || "Non configuré"}
            </p>
          </div>

          {activeWebsite && (
            <form
              action={async () => {
                "use server";

                const { supabase } = await requireAppContext();

                await supabase
                  .from("review_sources")
                  .delete()
                  .eq("id", activeWebsite.id);

                revalidatePath("/sources");
              }}
            >
              <button className="text-red-500 text-sm">
                Supprimer
              </button>
            </form>
          )}
        </div>
      </section>

      {/* INFO */}
      <section className="rf-card p-6">
        <p className="text-sm text-gray-400">
          ⚠️ Une seule source active par type. Ajouter une nouvelle remplace automatiquement l’ancienne.
        </p>
      </section>

    </div>
  );
}