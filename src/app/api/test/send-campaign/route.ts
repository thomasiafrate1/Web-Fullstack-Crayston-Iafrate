import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const formData = await req.formData();
    const campaignId = String(formData.get("campaignId") ?? "").trim();

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
    }

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("org_id", profile.org_id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("campaigns")
      .update({
        status: "sending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update campaign status" }, { status: 500 });
    }

    const { data: functionResult, error: functionError } = await supabase.functions.invoke(
      "send-campaign-emails",
      {
        body: {
          campaignId,
          orgId: profile.org_id,
        },
      },
    );

    const result = functionResult as {
      ok?: boolean;
      error?: string;
      successCount?: number;
      failureCount?: number;
      totalRecipients?: number;
    } | null;

    const finalStatus = functionError || !result?.ok ? "failed" : "sent";

    await supabase
      .from("campaigns")
      .update({
        status: finalStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    return NextResponse.json({
      ok: result?.ok ?? false,
      status: finalStatus,
      functionError: functionError?.message || null,
      result: result || null,
      successCount: result?.successCount ?? 0,
      failureCount: result?.failureCount ?? 0,
      totalRecipients: result?.totalRecipients ?? 0,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
