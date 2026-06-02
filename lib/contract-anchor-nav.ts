export const CONTRACT_ANCHOR_PAGE_EVENT = "ankuaru:contract-anchor-page";

export function openContractAnchorPage(contractUid?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CONTRACT_ANCHOR_PAGE_EVENT, {
      detail: { contractUid },
    }),
  );
}
