import { readDatabase, writeCollection } from "@/lib/json-db/server";
import type { TradeContractRecord } from "@/lib/bank-operations-db";
import {
  anchorTradeContractRecord,
  type ContractBlockchainAnchor,
} from "@/lib/blockchain/anchor-contract";

export function anchorTradeContractOnServer(contractUid: string) {
  const db = readDatabase();
  const contract = db.tradeContracts.find((item) => item.contractUid === contractUid);
  if (!contract) {
    return { errors: ["Contract not found."] as string[] };
  }

  if (contract.blockchain?.txHash) {
    return {
      contract,
      blockchain: contract.blockchain,
      alreadyAnchored: true,
    };
  }

  const blockchain: ContractBlockchainAnchor = anchorTradeContractRecord({
    contractUid: contract.contractUid,
    bankId: contract.bankId,
    buyer: contract.buyer,
    seller: contract.seller,
    commodity: contract.commodity,
    guaranteeLcUid: contract.guaranteeLcUid,
    quantity: contract.quantity,
    price: contract.price,
    settlementTrigger: contract.settlementTrigger,
    updatedAt: contract.updatedAt,
  });

  const updated: TradeContractRecord = {
    ...contract,
    status: "anchored",
    blockchain,
    updatedAt: blockchain.anchoredAt,
  };

  const tradeContracts = db.tradeContracts.map((item) =>
    item.contractUid === contractUid ? updated : item,
  );
  writeCollection("tradeContracts", tradeContracts);

  return { contract: updated, blockchain, alreadyAnchored: false };
}
