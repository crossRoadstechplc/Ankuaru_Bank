"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type PdfPreviewModalProps = {
  title: string;
  pdfUrl: string;
  downloadLabel?: string;
  onClose: () => void;
};

export function PdfPreviewModal({
  title,
  pdfUrl,
  downloadLabel = "Download PDF",
  onClose,
}: PdfPreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(undefined);
      setObjectUrl(undefined);

      try {
        const response = await fetch(pdfUrl);
        if (!response.ok) {
          throw new Error("PDF not found. Generate the document first.");
        }

        const blob = await response.blob();
        if (cancelled) return;

        setObjectUrl(URL.createObjectURL(blob));
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load PDF preview.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPdf();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return (
    <div
      className="pdf-preview-ov open"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="pdf-preview-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pdf-preview-head">
          <div>
            <p className="pdf-preview-eyebrow">Document preview</p>
            <h3 id="pdf-preview-title">{title}</h3>
          </div>
          <div className="pdf-preview-head__actions">
            <a
              className="pdf-preview-download"
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {downloadLabel}
            </a>
            <Button
              type="button"
              variant="legacy"
              size="legacy"
              className="pdf-preview-close"
              aria-label="Close preview"
              onClick={onClose}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="pdf-preview-body">
          {loading ? (
            <p className="pdf-preview-status">Loading PDF preview…</p>
          ) : error ? (
            <p className="pdf-preview-status pdf-preview-status--error">{error}</p>
          ) : objectUrl ? (
            <iframe
              className="pdf-preview-frame"
              src={objectUrl}
              title={title}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
