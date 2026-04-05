"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { TimerWidget } from "@/components/time-tracking/timer";
import { WeeklyView } from "@/components/time-tracking/weekly-view";
import { EntriesList } from "@/components/time-tracking/entries-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TimeTrackingPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  function handleUpdate() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header breadcrumbs={[{ label: "Time Tracking" }]} />
      <div className="flex-1 p-6 space-y-6">
        {/* Timer */}
        <TimerWidget onUpdate={handleUpdate} />

        {/* Tabs */}
        <Tabs defaultValue="week">
          <TabsList>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="list">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="mt-4">
            <WeeklyView refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <EntriesList refreshKey={refreshKey} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
