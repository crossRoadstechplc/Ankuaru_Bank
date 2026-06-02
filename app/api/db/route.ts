import { NextResponse } from "next/server";
import { readDatabase, resetDatabase } from "@/lib/json-db/server";

export async function GET() {
  return NextResponse.json(readDatabase());
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { reset?: boolean };
  if (body.reset) {
    return NextResponse.json(resetDatabase());
  }
  return NextResponse.json(readDatabase());
}
