import { Suspense } from "react";
import { auth } from "@/lib/auth/config";
import type { Metadata } from "next";
import { DollarSign, FolderKanban, CheckSquare, Clock, AlertCircle, Users, TrendingUp, Percent } from "lucide-react";
import { Header } from "@/components/layout/header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { ProjectsOverview } from "@/components/dashboard/projects-overview";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        breadcrumbs={[{ label: "Dashboard" }]}
      />
      <div className="flex-1 p-6 space-y-6">
        {/* Saludo */}
        <div>
          <h2 className="text-xl font-semibold">
            {greeting}, {session?.user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Aquí tenés un resumen de lo que está pasando en MGB.
          </p>
        </div>

        {/* KPIs */}
        <KpiCards />

        {/* Charts + Projects grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <div>
            <UpcomingDeadlines />
          </div>
        </div>

        {/* Projects + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProjectsOverview />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
