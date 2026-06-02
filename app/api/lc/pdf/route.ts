import { NextResponse } from "next/server";
import type { LetterOfCreditRecord } from "@/lib/bank-operations-db";
import { generateAndStoreLcPdf } from "@/lib/lc-pdf/generate";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    lcUid?: string;
    lc?: LetterOfCreditRecord;
  };

  if (!body.lcUid?.trim()) {
    return NextResponse.json({ error: "lcUid is required." }, { status: 400 });
  }

  const lcUid = body.lcUid.trim();
  const result = await generateAndStoreLcPdf(
    lcUid,
    body.lc?.lcUid === lcUid ? body.lc : undefined,
  );
  if (!result) {
    return NextResponse.json({ error: "Letter of credit not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    lcUid: result.lc.lcUid,
    pdfUrl: `/api/lc/${encodeURIComponent(result.lc.lcUid)}/pdf`,
  });
}
