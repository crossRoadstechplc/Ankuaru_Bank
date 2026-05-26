import { AuthSession } from "@/components/auth/auth-model";
import { DetailPanel } from "./DetailPanel";
import { ExportersSidebar } from "./ExportersSidebar";
import { PortfolioToolbar } from "./PortfolioToolbar";
import { RoleDashboardPanel } from "./RoleDashboardPanel";

export function PortfolioWorkspace({ session }: { session: AuthSession }) {
  return (
    <div className="app-body">
      <ExportersSidebar />
      <div className="main">
        <PortfolioToolbar />
        <div className="view-area" id="view-area" />
        <div
          id="portfolio-welcome"
          className="portfolio-welcome"
          role="status"
          aria-live="polite"
        >
          <RoleDashboardPanel session={session} />
        </div>
      </div>
      <DetailPanel />
    </div>
  );
}
