"use server";

import { revalidatePath } from "next/cache";

import { logAuditEvent, requireManagerContext } from "@/actions/utils";
import type { ReviewStatus } from "@/types/database";

const REVIEW_STATUSES: ReviewStatus[] = ["new", "in_progress", "resolved", "archived"];

export const createReviewAction = async (formData: FormData): Promise<void> => {
  try {
    const context = await requireManagerContext();
    const rating = Number(formData.get("rating"));
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return;
    }

    const authorName = String(formData.get("authorName") ?? "").trim() || null;
    const content = String(formData.get("content") ?? "").trim() || null;
    const source = String(formData.get("source") ?? "internal");

    const { data, error } = await context.supabase
      .from("reviews")
      .insert({
        org_id: context.orgId,
        rating,
        content,
        author_name: authorName,
        source: source === "google" ? "google" : "internal",
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("createReviewAction error:", error.message);
      return;
    }

    await logAuditEvent(context, "review.create", "review", data.id, {
      rating,
      source,
    });

    revalidatePath("/avis");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("createReviewAction exception:", error);
  }
};

export const updateReviewStatusAction = async (
  formData: FormData,
): Promise<void> => {
  try {
    const context = await requireManagerContext();
    const reviewId = String(formData.get("reviewId") ?? "").trim();
    const status = String(formData.get("status") ?? "") as ReviewStatus;

    if (!reviewId || !REVIEW_STATUSES.includes(status)) {
      return;
    }

    const { error } = await context.supabase
      .from("reviews")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .eq("org_id", context.orgId);

    if (error) {
      console.error("updateReviewStatusAction error:", error.message);
      return;
    }

    await logAuditEvent(context, "review.status.update", "review", reviewId, { status });
    revalidatePath("/avis");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("updateReviewStatusAction exception:", error);
  }
};
