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
    const name = String(formData.get("name") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const template = String(formData.get("template") ?? "").trim();
    const recipientsRaw = String(formData.get("recipients") ?? "").trim();

    if (!name || !subject || !template) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        org_id: profile.org_id,
        name,
        subject,
        template,
        status: "draft",
        created_by: user.id,
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: campaignError?.message || "Failed to create campaign" },
        { status: 500 },
      );
    }

    const recipients = recipientsRaw
      .split(/[\n,;]/)
      .map((e: string) => e.trim().toLowerCase())
      .filter(Boolean);

    if (recipients.length > 0) {
      const { error: recipientsError } = await supabase.from("campaign_recipients").insert(
        recipients.map((email: string) => ({
          campaign_id: campaign.id,
          org_id: profile.org_id,
          email,
          status: "draft",
        })),
      );

      if (recipientsError) {
        console.error("Recipients error:", recipientsError);
      }
    }

    return NextResponse.json({
      ok: true,
      campaignId: campaign.id,
      campaignName: campaign.name,
      recipientCount: recipients.length,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
