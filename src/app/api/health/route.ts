import { NextResponse } from "next/server";

// Endpoint de vérification de santé du service
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "review-flow-v2",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
