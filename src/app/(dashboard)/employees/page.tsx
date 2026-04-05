"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, UserCircle, Briefcase, Calendar } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, initials } from "@/lib/utils";
import Link from "next/link";

const employmentTypeLabels: Record<string, string> = {
  FULL_TIME: "Tiempo completo",
  PART_TIME: "Tiempo parcial",
  FREELANCE: "Freelance",
  CONTRACTOR: "Contratista",
};

export default function EmployeesPage() {
  const [search, setSearch] = useState("");

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/employees?${params}`);
      return res.json();
    },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header breadcrumbs={[{ label: "Empleados" }]} />
      <div className="flex-1 p-6">
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar empleados..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button className="ml-auto">
            <Plus className="h-4 w-4 mr-1" /> Nuevo empleado
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading
            ? [...Array(6)].map((_, i) => (
                <Card key={i}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
              ))
            : employees.map((emp: any) => (
                <Link key={emp.id} href={`/employees/${emp.id}`}>
                  <Card className="hover:shadow-md transition-all cursor-pointer group h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={emp.user.image} />
                          <AvatarFallback className="text-sm">{initials(emp.user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold group-hover:text-primary transition-colors">{emp.user.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {emp.jobTitle}
                          </p>
                          {emp.department && (
                            <p className="text-xs text-muted-foreground">{emp.department}</p>
                          )}
                        </div>
                        <Badge variant={emp.user.isActive ? "success" : "secondary"}>
                          {emp.user.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <UserCircle className="h-3 w-3" />
                          {employmentTypeLabels[emp.employmentType] ?? emp.employmentType}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          Ingreso: {formatDate(emp.startDate)}
                        </div>
                        <div>{emp._count?.projectMembers ?? 0} proyecto(s) activo(s)</div>
                      </div>

                      {emp.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {emp.skills.slice(0, 4).map((s: string) => (
                            <span key={s} className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">{s}</span>
                          ))}
                          {emp.skills.length > 4 && <span className="text-[10px] text-muted-foreground">+{emp.skills.length - 4}</span>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}

          {!isLoading && !employees.length && (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              <UserCircle className="mx-auto h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Sin empleados</p>
              <p className="text-sm mt-1">Agregá el primer miembro del equipo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
