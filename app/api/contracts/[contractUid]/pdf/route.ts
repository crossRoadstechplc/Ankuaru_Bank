import { NextResponse } from "next/server";
import { getContractPdf } from "@/lib/contract-pdf/generate";

type RouteContext = {
  params: Promise<{ contractUid: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { contractUid } = await context.params;
  const decodedUid = decodeURIComponent(contractUid);
  const pdf = await getContractPdf(decodedUid);

  if (!pdf) {
    return NextResponse.json({ error: "Contract not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${decodedUid}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
