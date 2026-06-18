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

  const acceptHeader = request.headers.get("accept") || "";
  if (acceptHeader.includes("application/pdf")) {
    return new NextResponse(new Uint8Array(result.pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.contract.contractUid}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({
    ok: true,
    contractUid: result.contract.contractUid,
    pdfUrl: `/api/contracts/${encodeURIComponent(result.contract.contractUid)}/pdf`,
  });
}
