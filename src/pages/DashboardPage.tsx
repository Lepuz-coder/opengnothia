import { CheckInWidget } from "@/components/dashboard/CheckInWidget";
import { SessionStatusCard } from "@/components/dashboard/SessionStatusCard";
import { WeeklyInsightCard } from "@/components/dashboard/WeeklyInsightCard";
import { QuickAccessButtons } from "@/components/dashboard/QuickAccessButtons";

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Merhaba</h1>
        <p className="text-[var(--text-muted)]">Bugün nasılsın?</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <CheckInWidget />
        </div>
        <div className="space-y-6">
          <SessionStatusCard />
          <WeeklyInsightCard />
          <QuickAccessButtons />
        </div>
      </div>
    </div>
  );
}
