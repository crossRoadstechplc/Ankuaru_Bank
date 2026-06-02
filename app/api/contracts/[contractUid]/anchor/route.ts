import { NextResponse } from "next/server";
import { anchorTradeContractOnServer } from "@/lib/blockchain/anchor-service";

type RouteParams = { params: Promise<{ contractUid: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const { contractUid } = await params;
  if (!contractUid?.trim()) {
    return NextResponse.json({ error: "contractUid is required." }, { status: 400 });
  }

  const result = anchorTradeContractOnServer(contractUid.trim());
  if (result.errors?.length) {
    return NextResponse.json({ error: result.errors[0] }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    contractUid: result.contract?.contractUid,
    status: result.contract?.status,
    blockchain: result.blockchain,
    alreadyAnchored: result.alreadyAnchored ?? false,
  });
}
