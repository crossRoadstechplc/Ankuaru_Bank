import { NextResponse } from "next/server";
import type { TradeContractRecord } from "@/lib/bank-operations-db";
import { generateAndStoreContractPdf } from "@/lib/contract-pdf/generate";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    contractUid?: string;
    contract?: TradeContractRecord;
  };

  if (!body.contractUid?.trim()) {
    return NextResponse.json(
      { error: "contractUid is required." },
      { status: 400 },
    );
  }

  const contractUid = body.contractUid.trim();
  const result = await generateAndStoreContractPdf(
    contractUid,
    body.contract?.contractUid === contractUid ? body.contract : undefined,
  );
  if (!result) {
    return NextResponse.json({ error: "Contract not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    contractUid: result.contract.contractUid,
    pdfUrl: `/api/contracts/${encodeURIComponent(result.contract.contractUid)}/pdf`,
  });
}
