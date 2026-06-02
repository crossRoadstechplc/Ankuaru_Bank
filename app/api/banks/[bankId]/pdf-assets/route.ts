import { NextResponse } from "next/server";
import { patchBankPdfAssetsInDb } from "@/lib/pdf/bank-assets-server";

type RouteParams = { params: Promise<{ bankId: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  const { bankId } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    signatoryName?: string;
  };

  if (!bankId?.trim()) {
    return NextResponse.json({ error: "bankId is required." }, { status: 400 });
  }

  const bank = patchBankPdfAssetsInDb(bankId, {
    signatoryName: body.signatoryName?.trim() || undefined,
  });

  if (!bank) {
    return NextResponse.json({ error: "Bank not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    bankId,
    pdfAssets: bank.pdfAssets ?? {},
  });
}
