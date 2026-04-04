"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { initials, formatRelativeTime } from "@/lib/utils";

const actionLabels: Record<string, string> = {
  CREATE: "creó",
  UPDATE: "actualizó",
  DELETE: "eliminó",
  EXPORT: "exportó",
  SHARE: "compartió",
};

const entityLabels: Record<string, string> = {
  Task: "una tarea",
  Project: "un proyecto",
  Invoice: "una factura",
  Client: "un cliente",
  Document: "un documento",
};

export function RecentActivity() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/recent-activity");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Actividad reciente</CardTitle>
        <CardDescription>Últimas acciones del equipo</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : !activities?.length ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Sin actividad reciente
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-3">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={activity.user?.image} />
                  <AvatarFallback className="text-xs">
                    {initials(activity.user?.name ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user?.name ?? "Sistema"}</span>
                    {" "}
                    <span className="text-muted-foreground">
                      {actionLabels[activity.action] ?? activity.action}{" "}
                      {entityLabels[activity.entity] ?? activity.entity}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
