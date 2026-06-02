export type ContractBlockchainAnchor = {
  network: string;
  smartContract: string;
  txHash: string;
  blockNumber: number;
  documentHash: string;
  anchoredAt: string;
};

export type AnchorTradeContractInput = {
  contractUid: string;
  bankId: string;
  buyer: string;
  seller: string;
  commodity: string;
  guaranteeLcUid: string;
  quantity: string;
  price: string;
  settlementTrigger: string;
  updatedAt: string;
};

function fnv1aHex(input: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function expandHex(seed: string, length: number) {
  let out = "";
  let current = seed;
  while (out.length < length) {
    current = fnv1aHex(current);
    out += current;
  }
  return out.slice(0, length);
}

export function buildContractDocumentHash(input: AnchorTradeContractInput) {
  const payload = [
    input.contractUid,
    input.bankId,
    input.buyer,
    input.seller,
    input.commodity,
    input.guaranteeLcUid,
    input.quantity,
    input.price,
    input.settlementTrigger,
    input.updatedAt,
  ].join("|");

  const digest = expandHex(payload, 64);
  return `0x${digest}`;
}

export function resolveSmartContractAddress(bankId: string) {
  const slug = bankId.replace(/^bank-/, "").toUpperCase();
  return `0xANK${expandHex(`${bankId}:trade-vault`, 32).slice(0, 32).toUpperCase()}${slug.slice(0, 4)}`;
}

export function anchorTradeContractRecord(
  input: AnchorTradeContractInput,
): ContractBlockchainAnchor {
  const documentHash = buildContractDocumentHash(input);
  const seed = `${input.contractUid}|${documentHash}|${input.updatedAt}`;
  const txHash = `0x${expandHex(seed, 64)}`;
  const blockNumber =
    18_000_000 + (parseInt(fnv1aHex(seed), 16) % 2_500_000);

  return {
    network: "ANKUARU Permissioned Ledger",
    smartContract: resolveSmartContractAddress(input.bankId),
    txHash,
    blockNumber,
    documentHash,
    anchoredAt: new Date().toISOString(),
  };
}
