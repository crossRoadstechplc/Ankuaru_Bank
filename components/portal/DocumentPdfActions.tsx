"use client";

import { useState } from "react";
import { PdfPreviewModal } from "@/components/portal/PdfPreviewModal";

type DocumentPdfActionsProps = {
  pdfUrl: string;
  title: string;
  downloadLabel?: string;
  className?: string;
};

export function DocumentPdfActions({
  pdfUrl,
  title,
  downloadLabel = "Download",
  className,
}: DocumentPdfActionsProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <span className={["role-pdf-actions", className].filter(Boolean).join(" ")}>
        <button
          type="button"
          className="role-inline-link"
          onClick={() => setPreviewOpen(true)}
        >
          Preview
        </button>
        <span className="role-pdf-actions__sep" aria-hidden="true">
          ·
        </span>
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
          {downloadLabel}
        </a>
      </span>
      {previewOpen ? (
        <PdfPreviewModal
          title={title}
          pdfUrl={pdfUrl}
          downloadLabel={downloadLabel}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </>
  );
}
