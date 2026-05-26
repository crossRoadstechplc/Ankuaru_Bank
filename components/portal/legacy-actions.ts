export type LegacyWindow = Window & {
  __ANK_LEGACY_BOOTED__?: boolean;
  toggleBsImporterNav?: () => void;
  openAuctionFromSidebar?: (button: HTMLButtonElement) => void;
  showBsSection?: (section: string, button: HTMLElement | null) => void;
  closeBackstage?: () => void;
  handleSearch?: (value: string) => void;
  toggleNotif?: () => void;
  openBackstage?: (section?: string) => void;
  filterExp?: (id: string | null, button: HTMLElement | null) => void;
  toggleExpPortfolioSidebar?: () => void;
  filterSt?: (status: string | null, button: HTMLElement | null) => void;
  setView?: (mode: string, button?: HTMLElement | null) => void;
  openToolbarFieldMap?: () => void;
  closeDetail?: () => void;
  switchDTab?: (tab: string, element: HTMLElement | null) => void;
  closeL4Wiz?: () => void;
  closeWizard?: () => void;
  wizBack?: () => void;
  wizNext?: () => void;
  cancelCloseMsPop?: () => void;
  scheduleCloseMsPop?: () => void;
  closeMsPop?: () => void;
  closeUID?: () => void;
  closeHrvMapModal?: () => void;
  switchRTab?: (tab: string, element: HTMLElement | null) => void;
};

export function legacyWindow() {
  if (typeof window === "undefined") return null;
  return window as LegacyWindow;
}

export function callLegacy(callback: (win: LegacyWindow) => void) {
  const win = legacyWindow();
  if (!win) return;
  callback(win);
}
