"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __ANK_LEGACY_BOOTED__?: boolean;
    relocateQatBrandToSidebar?: () => void;
    renderView?: () => void;
    renderRibbon?: () => void;
    updateStatusBar?: () => void;
    showBsPortfolioPreview?: () => void;
    bootRiskLayer?: () => void;
  }
}

function loadExternalScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-legacy-src="${src}"]`,
    );

    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.crossOrigin = "";
    script.dataset.legacySrc = src;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject();
    document.body.appendChild(script);
  });
}

function reinitializeLegacyDom() {
  window.relocateQatBrandToSidebar?.();
  window.renderView?.();
  window.renderRibbon?.();
  window.updateStatusBar?.();
  window.showBsPortfolioPreview?.();
  window.setTimeout(() => window.bootRiskLayer?.(), 100);
}

export function LegacyScriptLoader({
  scriptSource,
  onReady,
}: {
  scriptSource: string;
  onReady?: () => void;
}) {
  useEffect(() => {
    if (window.__ANK_LEGACY_BOOTED__) {
      reinitializeLegacyDom();
      onReady?.();
      return;
    }

    let cancelled = false;

    async function bootLegacyApp() {
      await loadExternalScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
      if (cancelled) return;

      const script = document.createElement("script");
      script.dataset.legacyApp = "ankuaru";
      script.text = scriptSource;
      document.body.appendChild(script);
      window.__ANK_LEGACY_BOOTED__ = true;
      onReady?.();
    }

    bootLegacyApp().catch((error) => {
      console.error("Failed to boot legacy Ankuaru UI", error);
    });

    return () => {
      cancelled = true;
    };
  }, [onReady, scriptSource]);

  return null;
}
