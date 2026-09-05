import { getApplicationLogs, getLogLevelCounts } from "@/controllers/log-controller";
import AppLogsView from "./_components/app-logs-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Application Logs | Invest Smarter",
  description: "View and filter application logs and system events.",
};

export default async function AppLogsPage() {
  const [initialLogsData, initialCountsData] = await Promise.all([
    getApplicationLogs({ page: 1, limit: 25, level: "ALL", sortOrder: "desc" }),
    getLogLevelCounts(),
  ]);

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen">
      <AppLogsView
        initialLogs={initialLogsData.logs}
        initialTotal={initialLogsData.total}
        initialTotalPages={initialLogsData.totalPages}
        initialCounts={initialCountsData.counts}
      />
    </div>
  );
}