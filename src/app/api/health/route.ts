import { NextResponse } from "next/server";

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
