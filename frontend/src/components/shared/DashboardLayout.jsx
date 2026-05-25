import KoraNav from "../KoraNav";
import { RefreshCw, AlertTriangle } from "lucide-react";

export default function DashboardLayout({
  sidebar,
  children,
  error,
  loading,
  onRefresh
}) {
  if (error) {
    return (
      <div className="ed-root">
        <KoraNav />
        <div className="ed-body">
          {sidebar}
          <main className="ed-main">
            <div className="ed-error-state">
              <AlertTriangle size={28} />
              <h3>Failed to load dashboard</h3>
              <p>{error}</p>
              <button className="kora-btn-primary" onClick={onRefresh}>
                <RefreshCw size={14} /> Try Again
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="ed-root">
      <KoraNav />
      <div className="ed-body">
        {sidebar}
        <main className="ed-main">
          {children}
        </main>
      </div>
    </div>
  );
}