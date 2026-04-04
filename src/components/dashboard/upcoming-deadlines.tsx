"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { AlertCircle, Calendar } from "lucide-react";
import { differenceInDays } from "date-fns";

export function UpcomingDeadlines() {
  const { data, isLoading } = useQuery({
    queryKey: ["upcoming-deadlines"],
    queryFn: async () => {
      const res = await fetch("/api/tasks?dueIn=7&limit=8&status=TODO,IN_PROGRESS,BLOCKED");
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const tasks = data?.data ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Próximos vencimientos
        </CardTitle>
        <CardDescription>Tareas con deadline en los próximos 7 días</CardDescription>
      </CardHeader>
      <CardContent>
        {!tasks.length ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Sin vencimientos próximos
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task: any) => {
              const daysLeft = task.dueDate
                ? differenceInDays(new Date(task.dueDate), new Date())
                : null;
              const isOverdue = daysLeft !== null && daysLeft < 0;
              const isUrgent = daysLeft !== null && daysLeft <= 1 && !isOverdue;

              return (
                <Link
                  key={task.id}
                  href={`/projects/${task.project?.slug}?task=${task.id}`}
                  className="block group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {task.project?.name}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {isOverdue ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Vencida
                        </Badge>
                      ) : isUrgent ? (
                        <Badge variant="warning" className="text-xs">
                          Hoy/Mañana
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {daysLeft}d
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
