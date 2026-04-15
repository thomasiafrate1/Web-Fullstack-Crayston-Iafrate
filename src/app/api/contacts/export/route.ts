import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

const escapeCsv = (value: string | null | undefined) => {
  const raw = value ?? "";
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
};

const buildExportResponse = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.org_id) {
    return new NextResponse("Profile not attached to organization", { status: 400 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("org_id", profile.org_id)
    .maybeSingle();
  const { data: organization } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", profile.org_id)
    .maybeSingle();
  const plan = subscription?.plan ?? organization?.plan ?? "free";

  if (plan !== "pro") {
    return new NextResponse("Upgrade to Pro to access contacts export", { status: 403 });
  }

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("email, full_name, phone, company")
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: false });

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  const header = "email,full_name,phone,company";
  const rows = (contacts ?? []).map((contact) =>
    [
      escapeCsv(contact.email),
      escapeCsv(contact.full_name),
      escapeCsv(contact.phone),
      escapeCsv(contact.company),
    ].join(","),
  );

  return new NextResponse([header, ...rows].join("\n"), {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="contacts-export.csv"',
    },
  });
};

export async function GET(request: NextRequest) {
  void request;
  return buildExportResponse();
}

export async function POST(request: NextRequest) {
  void request;
  return buildExportResponse();
}
