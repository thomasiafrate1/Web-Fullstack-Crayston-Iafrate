"use server";

import { revalidatePath } from "next/cache";

import { logAuditEvent, requireManagerContext } from "@/actions/utils";

type ActionResult = { ok: boolean; error?: string };

export const createContactAction = async (
  formData: FormData,
): Promise<ActionResult> => {
  try {
    const context = await requireManagerContext();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();

    if (!email) {
      return { ok: false, error: "Email requis." };
    }

    const fullName = String(formData.get("fullName") ?? "").trim() || null;
    const phone = String(formData.get("phone") ?? "").trim() || null;
    const company = String(formData.get("company") ?? "").trim() || null;

    const { data, error } = await context.supabase
      .from("contacts")
      .upsert(
        {
          org_id: context.orgId,
          email,
          full_name: fullName,
          phone,
          company,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "org_id,email" },
      )
      .select("id")
      .single();

    if (error) {
      console.error("createContactAction error:", error.message);
      return { ok: false, error: error.message };
    }

    await logAuditEvent(context, "contact.upsert", "contact", data.id, {
      email,
    });

    revalidatePath("/contacts");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    console.error("createContactAction exception:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Creation du contact impossible.",
    };
  }
};

export const deleteContactAction = async (formData: FormData): Promise<void> => {
  try {
    const context = await requireManagerContext();
    const contactId = String(formData.get("contactId") ?? "").trim();
    if (!contactId) {
      return;
    }

    const { error } = await context.supabase
      .from("contacts")
      .delete()
      .eq("id", contactId)
      .eq("org_id", context.orgId);

    if (error) {
      console.error("deleteContactAction error:", error.message);
      return;
    }

    await logAuditEvent(context, "contact.delete", "contact", contactId);

    revalidatePath("/contacts");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("deleteContactAction exception:", error);
  }
};

export const importContactsCsvAction = async (
  formData: FormData,
): Promise<ActionResult> => {
  try {
    const context = await requireManagerContext();
    const csv = String(formData.get("csv") ?? "").trim();

    if (!csv) {
      return { ok: false, error: "CSV vide." };
    }

    const lines = csv.split("\n").map((line) => line.trim()).filter(Boolean);
    const rows = lines
      .map((line) => line.split(",").map((value) => value.trim()))
      .filter((parts) => parts[0])
      .map(([email, fullName, phone, company]) => ({
        org_id: context.orgId,
        email: email.toLowerCase(),
        full_name: fullName || null,
        phone: phone || null,
        company: company || null,
      }));

    if (rows.length === 0) {
      return { ok: false, error: "Aucune ligne CSV valide detectee." };
    }

    const { error } = await context.supabase
      .from("contacts")
      .upsert(rows, { onConflict: "org_id,email" });

    if (error) {
      console.error("importContactsCsvAction error:", error.message);
      return { ok: false, error: error.message };
    }

    await logAuditEvent(context, "contact.import.csv", "contact", null, {
      count: rows.length,
    });

    revalidatePath("/contacts");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    console.error("importContactsCsvAction exception:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Import CSV impossible.",
    };
  }
};
