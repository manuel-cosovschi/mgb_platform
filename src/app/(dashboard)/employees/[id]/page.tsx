import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatCurrency, initials } from "@/lib/utils";
import { Briefcase, Calendar, DollarSign, Mail } from "lucide-react";
import { EmployeeLeaveTab } from "@/components/employees/leave-tab";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      user: true,
      manager: { include: { user: { select: { id: true, name: true, image: true } } } },
      subordinates: { include: { user: { select: { id: true, name: true } } } },
      leaveRequests: { orderBy: { startDate: "desc" }, take: 10 },
      onboardingTasks: { orderBy: { order: "asc" } },
      projectMembers: {
        include: { project: { select: { id: true, name: true, slug: true, status: true } } },
      },
    },
  });

  if (!employee) notFound();

  const employmentTypeLabels: Record<string, string> = {
    FULL_TIME: "Tiempo completo",
    PART_TIME: "Tiempo parcial",
    FREELANCE: "Freelance",
    CONTRACTOR: "Contratista",
  };

  const completedOnboarding = employee.onboardingTasks.filter((t) => t.completedAt).length;

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        breadcrumbs={[
          { label: "Empleados", href: "/employees" },
          { label: employee.user.name },
        ]}
      />
      <div className="flex-1 p-6 space-y-6">
        {/* Profile header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <Avatar className="h-20 w-20">
                <AvatarImage src={employee.user.image ?? undefined} />
                <AvatarFallback className="text-xl">{initials(employee.user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{employee.user.name}</h1>
                    <p className="text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="h-4 w-4" />
                      {employee.jobTitle}
                      {employee.department && ` · ${employee.department}`}
                    </p>
                  </div>
                  <Badge variant={employee.user.isActive ? "success" : "secondary"}>
                    {employee.user.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    {employee.user.email}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Ingresó {formatDate(employee.startDate)}
                  </div>
                  {employee.salary && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4" />
                      {formatCurrency(Number(employee.salary), employee.salaryCurrency as any)}/mes
                    </div>
                  )}
                  <div>{employmentTypeLabels[employee.employmentType]}</div>
                </div>
              </div>
            </div>

            {employee.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {employee.skills.map((s) => (
                  <span key={s} className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">{s}</span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="projects">
          <TabsList>
            <TabsTrigger value="projects">Proyectos</TabsTrigger>
            <TabsTrigger value="leave">Licencias</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {employee.projectMembers.map((pm) => (
                <a key={pm.project.id} href={`/projects/${pm.project.slug}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <p className="font-medium">{pm.project.name}</p>
                      <Badge variant="secondary">{pm.project.status}</Badge>
                    </CardContent>
                  </Card>
                </a>
              ))}
              {!employee.projectMembers.length && (
                <p className="text-muted-foreground text-sm col-span-full">Sin proyectos asignados</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="leave" className="mt-4">
            <EmployeeLeaveTab employeeId={employee.id} leaveRequests={employee.leaveRequests} />
          </TabsContent>

          <TabsContent value="onboarding" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Onboarding — {completedOnboarding}/{employee.onboardingTasks.length} completado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {employee.onboardingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-md border">
                    <input
                      type="checkbox"
                      checked={!!task.completedAt}
                      readOnly
                      className="h-4 w-4 accent-primary"
                    />
                    <span className={`text-sm flex-1 ${task.completedAt ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
                    )}
                  </div>
                ))}
                {!employee.onboardingTasks.length && (
                  <p className="text-muted-foreground text-sm">Sin tareas de onboarding</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
