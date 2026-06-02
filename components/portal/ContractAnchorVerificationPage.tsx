"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Copy, Link2, Search, ShieldCheck } from "lucide-react";
import { DocumentPdfActions } from "@/components/portal/DocumentPdfActions";
import { Button } from "@/components/ui/button";
import {
  canViewContractAnchorRecord,
  type BlockchainVerificationScope,
} from "@/lib/blockchain-access";
import { getBank } from "@/lib/bank-db";
import {
  OPERATIONS_UPDATED_EVENT,
  contractPdfUrl,
  findTradeContractByUid,
  formatBlockchainTx,
  listTradeContracts,
  type TradeContractRecord,
} from "@/lib/bank-operations-db";

function PageBackButton({
  onBack,
  label,
}: {
  onBack: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="legacy"
      size="legacy"
      className="role-page-back"
      onClick={onBack}
    >
      <ArrowLeft aria-hidden="true" />
      {label}
    </Button>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="contract-anchor__field">
      <span>{label}</span>
      <div className="contract-anchor__value-row">
        <code>{value}</code>
        <button
          type="button"
          className="contract-anchor__copy"
          onClick={copyValue}
          aria-label={`Copy ${label}`}
        >
          <Copy aria-hidden="true" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function ContractAnchorDetails({
  contract,
  bankName,
}: {
  contract: TradeContractRecord;
  bankName: string;
}) {
  const anchor = contract.blockchain;
  const anchored = Boolean(anchor?.txHash);

  return (
    <>
      <section className="role-form__section role-form__section--wide contract-anchor__status-section">
        <div className="contract-anchor__status-bar">
          <div
            className={`contract-anchor__status${
              anchored ? " contract-anchor__status--anchored" : ""
            }`}
          >
            {anchored ? (
              <CheckCircle2 aria-hidden="true" />
            ) : (
              <ShieldCheck aria-hidden="true" />
            )}
            <div>
              <strong>{anchored ? "Anchored on-chain" : "Not yet anchored"}</strong>
              <p>
                {anchored
                  ? "This contract hash was submitted to the ANKUARU permissioned ledger."
                  : "Generate or anchor this contract to record an immutable hash on-chain."}
              </p>
            </div>
          </div>
          <DocumentPdfActions
            className="role-pdf-actions--anchor-bar"
            pdfUrl={contractPdfUrl(contract.contractUid)}
            title={`Trade Contract · ${contract.contractUid}`}
            downloadLabel="Download contract PDF"
          />
        </div>
      </section>

      <section className="role-form__section role-form__section--wide">
        <h3>Contract Summary</h3>
        <div className="role-detail-grid">
          <div>
            <span>Contract UID</span>
            <strong>{contract.contractUid}</strong>
          </div>
          <div>
            <span>Bank</span>
            <strong>{bankName}</strong>
          </div>
          <div>
            <span>Buyer</span>
            <strong>{contract.buyer}</strong>
          </div>
          <div>
            <span>Seller</span>
            <strong>{contract.seller}</strong>
          </div>
          <div>
            <span>Commodity</span>
            <strong>{contract.commodity || "—"}</strong>
          </div>
          <div>
            <span>Linked LC</span>
            <strong>{contract.guaranteeLcUid || "—"}</strong>
          </div>
          <div>
            <span>Settlement trigger</span>
            <strong>{contract.settlementTrigger || "—"}</strong>
          </div>
          <div>
            <span>Record status</span>
            <strong>{contract.status}</strong>
          </div>
        </div>
      </section>

      {anchor ? (
        <section className="role-form__section role-form__section--wide contract-anchor__ledger">
          <div className="role-form__section-head">
            <h3>Ledger Attestation</h3>
            <p>
              Immutable proof that contract terms were registered against the bank
              trade-vault smart contract.
            </p>
          </div>
          <div className="contract-anchor__attestation">
            <CopyField label="Network" value={anchor.network} />
            <CopyField label="Smart contract" value={anchor.smartContract} />
            <CopyField label="Transaction hash" value={anchor.txHash} />
            <CopyField
              label="Block number"
              value={anchor.blockNumber.toLocaleString()}
            />
            <CopyField label="Document hash" value={anchor.documentHash} />
            <CopyField
              label="Anchored at"
              value={new Date(anchor.anchoredAt).toLocaleString()}
            />
          </div>
          <p className="role-form__hint">
            Short tx reference:{" "}
            <strong>{formatBlockchainTx(anchor.txHash)}</strong>
          </p>
        </section>
      ) : null}
    </>
  );
}

export function ContractAnchorVerificationPage({
  bankId,
  initialContractUid,
  onBack,
  backLabel = "Back",
  scope = "full",
  clientLegalName,
  scopeLabel,
}: {
  bankId: string;
  initialContractUid?: string;
  onBack: () => void;
  backLabel?: string;
  scope?: BlockchainVerificationScope;
  clientLegalName?: string;
  scopeLabel?: string;
}) {
  const bank = getBank(bankId);
  const [query, setQuery] = useState(initialContractUid ?? "");
  const [selectedUid, setSelectedUid] = useState(initialContractUid ?? "");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setTick((current) => current + 1);
    }
    window.addEventListener(OPERATIONS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(OPERATIONS_UPDATED_EVENT, refresh);
  }, []);

  useEffect(() => {
    if (initialContractUid) {
      setQuery(initialContractUid);
      setSelectedUid(initialContractUid);
    }
  }, [initialContractUid]);

  void tick;

  const contracts = useMemo(() => {
    const all = listTradeContracts(bankId);
    if (scope !== "own-contracts" || !clientLegalName?.trim()) return all;
    return all.filter((item) =>
      canViewContractAnchorRecord(scope, item, clientLegalName),
    );
  }, [bankId, tick, scope, clientLegalName]);

  const contract =
    selectedUid && scope !== "none"
      ? findTradeContractByUid(bankId, selectedUid.trim())
      : undefined;
  const visibleContract =
    contract &&
    canViewContractAnchorRecord(scope, contract, clientLegalName)
      ? contract
      : undefined;

  const recentAnchored = contracts
    .filter((item) => item.blockchain?.txHash)
    .slice(0, 6);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setSelectedUid(query.trim());
  }

  return (
    <div className="role-panel role-page contract-anchor-page">
      <PageBackButton onBack={onBack} label={backLabel} />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">BLOCKCHAIN VERIFICATION</p>
        <h2>On-Chain Contract Record</h2>
        {scopeLabel ? (
          <p className="contract-anchor__scope-badge">{scopeLabel}</p>
        ) : null}
        <p>
          Look up a bank-backed trade contract to inspect its ledger attestation,
          transaction hash, document hash, and smart contract registration on the
          ANKUARU permissioned network.
          {scope === "own-contracts"
            ? " You can only verify contracts where you are the buyer or seller."
            : null}
        </p>
      </div>

      <form className="role-form contract-anchor-page__form" onSubmit={handleSearch}>
        <section className="role-form__section role-form__section--wide">
          <h3>Contract lookup</h3>
          <label>
            <span>Contract UID</span>
            <div className="contract-anchor__search-row">
              <input
                type="text"
                className="contract-anchor__search-input"
                placeholder="CTR-2026-00091"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button type="submit" className="contract-anchor__verify-btn">
                <Search aria-hidden="true" />
                Verify
              </button>
            </div>
          </label>
        </section>

        {selectedUid && !visibleContract ? (
          <div className="role-form__hint role-form__hint--warning role-form__section--wide">
            {contract && scope === "own-contracts" ? (
              <>
                Contract <strong>{selectedUid}</strong> exists but is not linked
                to your client account.
              </>
            ) : (
              <>
                No contract found for <strong>{selectedUid}</strong>
                {scope === "own-contracts"
                  ? " among your bank-backed trades."
                  : " in this bank tenant."}
              </>
            )}
          </div>
        ) : null}

        {visibleContract ? (
          <ContractAnchorDetails
            contract={visibleContract}
            bankName={bank?.displayName ?? "Unknown bank"}
          />
        ) : null}

        {recentAnchored.length > 0 ? (
          <section className="role-form__section role-form__section--wide">
            <h3>Recent anchored contracts</h3>
            <div className="contract-anchor__recent">
              {recentAnchored.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`contract-anchor__recent-item${
                    selectedUid === item.contractUid
                      ? " contract-anchor__recent-item--active"
                      : ""
                  }`}
                  onClick={() => {
                    setQuery(item.contractUid);
                    setSelectedUid(item.contractUid);
                  }}
                >
                  <strong>{item.contractUid}</strong>
                  <span>{item.buyer} → {item.seller}</span>
                  <small>
                    <Link2 aria-hidden="true" />
                    {formatBlockchainTx(item.blockchain!.txHash)}
                  </small>
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </form>
    </div>
  );
}
