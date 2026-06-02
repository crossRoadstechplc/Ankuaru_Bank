"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileImage, Stamp, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BANKS_UPDATED_EVENT,
  getBank,
  updateBankPdfAssets,
} from "@/lib/bank-db";
import {
  previewBankPdfAssetUrl,
  saveBankSignatoryName,
  uploadBankPdfAsset,
} from "@/lib/bank-pdf-assets-client";

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

function AssetUploadCard({
  title,
  description,
  previewUrl,
  uploading,
  onUpload,
}: {
  title: string;
  description: string;
  previewUrl?: string;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="role-form__section role-form__section--wide bank-doc-assets__section">
      <div className="role-form__section-head">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="bank-doc-assets__row">
        <div className="bank-doc-assets__controls">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="bank-doc-assets__file-input"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.currentTarget.value = "";
            }}
          />
          <Button
            type="button"
            variant="legacy"
            size="legacy"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload aria-hidden="true" />
            {uploading ? "Uploading..." : previewUrl ? "Replace image" : "Choose image"}
          </Button>
          <span className="bank-doc-assets__hint">PNG, JPG, or WEBP</span>
        </div>
        <div className="bank-doc-assets__preview">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={`${title} preview`} />
          ) : (
            <span>No upload yet</span>
          )}
        </div>
      </div>
    </section>
  );
}

export function BankDocumentAssetsPage({
  bankId,
  onBack,
}: {
  bankId: string;
  onBack: () => void;
}) {
  const bank = getBank(bankId);
  const [signatoryName, setSignatoryName] = useState(
    () => bank?.pdfAssets?.signatoryName ?? bank?.adminUser ?? "",
  );
  const [assetVersion, setAssetVersion] = useState(
    () => bank?.pdfAssets?.updatedAt ?? "0",
  );
  const [uploading, setUploading] = useState<"signature" | "verifier-stamp" | null>(
    null,
  );
  const [savingName, setSavingName] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);

  useEffect(() => {
    function refreshBank() {
      const current = getBank(bankId);
      if (current?.pdfAssets?.signatoryName) {
        setSignatoryName(current.pdfAssets.signatoryName);
      }
      if (current?.pdfAssets?.updatedAt) {
        setAssetVersion(current.pdfAssets.updatedAt);
      }
    }

    refreshBank();
    window.addEventListener(BANKS_UPDATED_EVENT, refreshBank);
    return () => window.removeEventListener(BANKS_UPDATED_EVENT, refreshBank);
  }, [bankId]);

  async function handleUpload(
    assetType: "signature" | "verifier-stamp",
    file: File,
  ) {
    setUploading(assetType);
    setFeedback(null);
    try {
      const result = await uploadBankPdfAsset(bankId, assetType, file);
      updateBankPdfAssets(bankId, result.pdfAssets);
      setAssetVersion(result.pdfAssets.updatedAt ?? Date.now().toString());
      setFeedback({
        kind: "success",
        message:
          assetType === "signature"
            ? "Authorized signature uploaded. Regenerate LC/contract PDFs to apply."
            : "Verifier stamp uploaded. Regenerate LC/contract PDFs to apply.",
      });
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Upload failed.",
      });
    } finally {
      setUploading(null);
    }
  }

  async function handleSaveSignatory() {
    setSavingName(true);
    setFeedback(null);
    try {
      const result = await saveBankSignatoryName(bankId, signatoryName);
      updateBankPdfAssets(bankId, result.pdfAssets);
      setFeedback({
        kind: "success",
        message: "Signatory name saved for PDF documents.",
      });
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Failed to save signatory name.",
      });
    } finally {
      setSavingName(false);
    }
  }

  const signaturePreview = bank?.pdfAssets?.signatureFile
    ? previewBankPdfAssetUrl(bankId, "signature", assetVersion)
    : undefined;
  const stampPreview = bank?.pdfAssets?.verifierStampFile
    ? previewBankPdfAssetUrl(bankId, "verifier-stamp", assetVersion)
    : undefined;

  return (
    <div className="role-panel role-page">
      <PageBackButton onBack={onBack} label="Back to Bank Admin" />
      <div className="role-page__header">
        <p className="role-panel__eyebrow">DOCUMENT BRANDING</p>
        <h2>PDF Signature & Verifier Stamp</h2>
        <p>
          Upload your bank&apos;s authorized signatory handwriting and official verifier
          stamp. These images are embedded on generated Letters of Credit and bank-backed
          trade contracts for {bank?.displayName ?? "your bank"}.
        </p>
      </div>

      {feedback ? (
        <p className={`role-form__feedback role-form__feedback--${feedback.kind}`}>
          {feedback.message}
        </p>
      ) : null}

      <form className="role-form bank-doc-assets" onSubmit={(event) => event.preventDefault()}>
        <section className="role-form__section role-form__section--wide">
          <div className="role-form__section-head">
            <h3>Authorized Signatory Name</h3>
            <p>Printed name shown under the signature on LC and contract PDFs.</p>
          </div>
          <label className="role-form__field">
            <span>Signatory full name</span>
            <Input
              value={signatoryName}
              onChange={(event) => setSignatoryName(event.target.value)}
              placeholder="e.g. Hanna Bekele"
            />
          </label>
          <div className="role-form__actions bank-doc-assets__actions">
            <Button
              type="button"
              variant="legacy"
              size="legacy"
              disabled={savingName || !signatoryName.trim()}
              onClick={() => void handleSaveSignatory()}
            >
              {savingName ? "Saving..." : "Save Signatory Name"}
            </Button>
          </div>
        </section>

        <AssetUploadCard
          title="Authorized Signature Image"
          description="Scan or photograph the trade finance officer's wet signature on white background."
          previewUrl={signaturePreview}
          uploading={uploading === "signature"}
          onUpload={(file) => void handleUpload("signature", file)}
        />

        <AssetUploadCard
          title="Bank Verifier Stamp"
          description="Upload the official bank verifier rubber stamp used on LC and contract documents."
          previewUrl={stampPreview}
          uploading={uploading === "verifier-stamp"}
          onUpload={(file) => void handleUpload("verifier-stamp", file)}
        />

        <section className="role-form__section role-form__section--wide bank-doc-assets__note">
          <div className="role-form__section-head">
            <h3>
              <FileImage aria-hidden="true" />
              Usage
            </h3>
            <p>
              Signature and stamp appear on newly generated PDFs. Existing cached PDF files
              keep the previous artwork until contracts or LCs are regenerated.
            </p>
          </div>
          <p className="bank-doc-assets__note-copy">
            <Stamp aria-hidden="true" />
            Buyer and seller signature images remain platform defaults unless customized
            separately in a future release.
          </p>
        </section>
      </form>
    </div>
  );
}
