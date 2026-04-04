"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter, Building2, Mail, Phone, Tag } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/lib/utils";
import { CRMKanban } from "@/components/crm/crm-kanban";
import { CreateClientDialog } from "@/components/crm/create-client-dialog";

const stageLabels: Record<string, string> = {
  LEAD: "Lead",
  CONTACTED: "Contactado",
  PROPOSAL_SENT: "Propuesta enviada",
  NEGOTIATION: "Negociación",
  WON: "Ganado",
  LOST: "Perdido",
};

const stageBadge: Record<string, string> = {
  LEAD: "secondary",
  CONTACTED: "info",
  PROPOSAL_SENT: "warning",
  NEGOTIATION: "purple",
  WON: "success",
  LOST: "destructive",
};

const scoreColors: Record<string, string> = {
  HIGH: "text-emerald-500",
  MEDIUM: "text-yellow-500",
  LOW: "text-slate-400",
};

export default function CRMPage() {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["clients", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", "50");
      const res = await fetch(`/api/clients?${params}`);
      return res.json();
    },
    staleTime: 30_000,
  });

  const clients = data?.data ?? [];

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        breadcrumbs={[{ label: "CRM" }]}
      />
      <div className="flex-1 p-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 ml-auto">
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList className="h-10">
                <TabsTrigger value="list">Lista</TabsTrigger>
                <TabsTrigger value="kanban">Pipeline</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => setOpenCreate(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo cliente
            </Button>
          </div>
        </div>

        {view === "kanban" ? (
          <CRMKanban clients={clients} isLoading={isLoading} onUpdate={refetch} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoading
              ? [...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              : clients.map((client: any) => (
                  <Card
                    key={client.id}
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => window.location.href = `/crm/${client.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{initials(client.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                            {client.name}
                          </p>
                          {client.company && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Building2 className="h-3 w-3" />
                              {client.company}
                            </p>
                          )}
                        </div>
                        <Badge variant={(stageBadge[client.stage] ?? "secondary") as any}>
                          {stageLabels[client.stage] ?? client.stage}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        {client.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </p>
                        )}
                        {client.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </p>
                        )}
                      </div>

                      {client.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {client.tags.slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-0.5 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                          {client.tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{client.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-xs text-muted-foreground">
                          {client._count?.projects ?? 0} proyecto{client._count?.projects !== 1 ? "s" : ""}
                        </span>
                        <span className={`text-xs font-medium ${scoreColors[client.score]}`}>
                          ● {client.score === "HIGH" ? "Alta" : client.score === "MEDIUM" ? "Media" : "Baja"} prioridad
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

            {!isLoading && !clients.length && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <Building2 className="mx-auto h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium">Sin clientes</p>
                <p className="text-sm mt-1">Creá tu primer cliente para empezar.</p>
                <Button className="mt-4" onClick={() => setOpenCreate(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar cliente
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateClientDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSuccess={() => { setOpenCreate(false); refetch(); }}
      />
    </div>
  );
}
