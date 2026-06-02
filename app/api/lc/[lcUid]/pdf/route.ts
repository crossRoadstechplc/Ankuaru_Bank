import { NextResponse } from "next/server";
import { getLcPdf } from "@/lib/lc-pdf/generate";

type RouteContext = {
  params: Promise<{ lcUid: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { lcUid } = await context.params;
  const decodedUid = decodeURIComponent(lcUid);
  const pdf = await getLcPdf(decodedUid);

  if (!pdf) {
    return NextResponse.json(
      { error: "Letter of credit not found." },
      { status: 404 },
    );
  }

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${decodedUid}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
