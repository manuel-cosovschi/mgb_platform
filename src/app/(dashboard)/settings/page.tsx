"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Building2, Users, Bell, Plug, Plus, Trash2, Save, Shield,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanySettings {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  city?: string;
  country?: string;
  invoicePrefix: string;
  invoiceNextNumber: number;
  defaultCurrency: string;
  logoUrl?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "SOCIO" | "EMPLEADO" | "CLIENTE";
  image?: string;
  createdAt: string;
  employee?: { department?: string; position?: string };
  client?: { company?: string };
}

// ─── Company Tab ──────────────────────────────────────────────────────────────

function CompanyTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<CompanySettings>>({});
  const [loaded, setLoaded] = useState(false);

  const { data: settings, isLoading } = useQuery<CompanySettings>({
    queryKey: ["settings-company"],
    queryFn: async () => {
      const r = await fetch("/api/settings/company");
      return r.json();
    },
  });

  // Initialize form once data loads
  // eslint-disable-next-line react-hooks/exhaustive-deps
  if (settings && !loaded) {
    setForm(settings);
    setLoaded(true);
  }

  const mutation = useMutation({
    mutationFn: async (data: Partial<CompanySettings>) => {
      const r = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("Error al guardar");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-company"] });
      toast.success("Configuración guardada");
    },
    onError: () => toast.error("Error al guardar la configuración"),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const handleSave = () => mutation.mutate(form);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información de la empresa</CardTitle>
          <CardDescription>Datos generales y de contacto</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre de la empresa</Label>
            <Input
              value={form.name || ""}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="MGB Software Factory"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email || ""}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="info@empresa.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input
              value={form.phone || ""}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+34 600 000 000"
            />
          </div>
          <div className="space-y-2">
            <Label>Sitio web</Label>
            <Input
              value={form.website || ""}
              onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
              placeholder="https://mgbsoftware.com"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Dirección</Label>
            <Input
              value={form.address || ""}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="Calle Principal 123, Madrid"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración de facturación</CardTitle>
          <CardDescription>Prefijos, numeración y tasas</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Prefijo de factura</Label>
            <Input
              value={form.invoicePrefix || ""}
              onChange={(e) => setForm((p) => ({ ...p, invoicePrefix: e.target.value }))}
              placeholder="FAC"
            />
          </div>
          <div className="space-y-2">
            <Label>Próximo número</Label>
            <Input
              type="number"
              value={form.invoiceNextNumber || 1}
              onChange={(e) => setForm((p) => ({ ...p, invoiceNextNumber: parseInt(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Moneda</Label>
            <Select
              value={form.defaultCurrency || "ARS"}
              onValueChange={(v) => setForm((p) => ({ ...p, defaultCurrency: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR — Euro</SelectItem>
                <SelectItem value="USD">USD — Dólar</SelectItem>
                <SelectItem value="ARS">ARS — Peso Argentino</SelectItem>
                <SelectItem value="GBP">GBP — Libra</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={mutation.isPending}>
          <Save className="h-4 w-4" />
          {mutation.isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "EMPLEADO" });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users", search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      const r = await fetch(`/api/users?${params}`);
      return r.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newUser) => {
      const r = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Error al crear usuario");
      }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario creado correctamente");
      setInviteOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "EMPLEADO" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const r = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!r.ok) throw new Error("Error al actualizar");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Rol actualizado");
    },
    onError: () => toast.error("Error al actualizar el rol"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Error al eliminar");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario eliminado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleColor: Record<string, string> = {
    SOCIO: "purple",
    EMPLEADO: "default",
    CLIENTE: "secondary",
  };

  const roleLabel: Record<string, string> = {
    SOCIO: "Socio",
    EMPLEADO: "Empleado",
    CLIENTE: "Cliente",
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <Input
          placeholder="Buscar usuarios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los roles</SelectItem>
            <SelectItem value="SOCIO">Socios</SelectItem>
            <SelectItem value="EMPLEADO">Empleados</SelectItem>
            <SelectItem value="CLIENTE">Clientes</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Nuevo usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear usuario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input
                  value={newUser.name}
                  onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ana García"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                  placeholder="ana@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Contraseña inicial</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(v) => setNewUser((p) => ({ ...p, role: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOCIO">Socio</SelectItem>
                    <SelectItem value="EMPLEADO">Empleado</SelectItem>
                    <SelectItem value="CLIENTE">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
              <Button
                onClick={() => createMutation.mutate(newUser)}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creando..." : "Crear usuario"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="divide-y">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {user.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    {user.employee?.department && (
                      <p className="text-xs text-muted-foreground">{user.employee.department}</p>
                    )}
                    {user.client?.company && (
                      <p className="text-xs text-muted-foreground">{user.client.company}</p>
                    )}
                  </div>
                  <Badge variant={roleColor[user.role] as any}>{roleLabel[user.role]}</Badge>
                  <Select
                    value={user.role}
                    onValueChange={(v) => updateRoleMutation.mutate({ id: user.id, role: v })}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOCIO">Socio</SelectItem>
                      <SelectItem value="EMPLEADO">Empleado</SelectItem>
                      <SelectItem value="CLIENTE">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm(`¿Eliminar a ${user.name}?`)) deleteMutation.mutate(user.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {users.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No se encontraron usuarios
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

const NOTIFICATION_TYPES = [
  { key: "task_assigned", label: "Tarea asignada", description: "Cuando te asignan una tarea" },
  { key: "task_due_soon", label: "Tarea próxima a vencer", description: "24h antes del vencimiento" },
  { key: "task_completed", label: "Tarea completada", description: "Cuando un colaborador completa una tarea" },
  { key: "invoice_paid", label: "Factura pagada", description: "Cuando una factura es marcada como pagada" },
  { key: "invoice_overdue", label: "Factura vencida", description: "Cuando una factura supera su fecha límite" },
  { key: "project_update", label: "Actualización de proyecto", description: "Cambios en proyectos que participás" },
  { key: "new_comment", label: "Nuevo comentario", description: "Comentarios en tus tareas o proyectos" },
  { key: "leave_approved", label: "Licencia aprobada", description: "Cuando tu solicitud de licencia es procesada" },
];

function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIFICATION_TYPES.map((t) => [t.key, true]))
  );
  const [emailPrefs, setEmailPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIFICATION_TYPES.map((t) => [t.key, false]))
  );

  const handleSave = () => {
    toast.success("Preferencias de notificación guardadas");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notificaciones en la plataforma</CardTitle>
          <CardDescription>Configura qué eventos generan notificaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-0 items-center mb-3">
            <span />
            <span className="text-xs text-muted-foreground font-medium text-center">En app</span>
            <span className="text-xs text-muted-foreground font-medium text-center">Email</span>
          </div>
          {NOTIFICATION_TYPES.map((type) => (
            <div
              key={type.key}
              className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center py-2.5 border-b last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{type.label}</p>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={prefs[type.key]}
                  onCheckedChange={(v) => setPrefs((p) => ({ ...p, [type.key]: v }))}
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={emailPrefs[type.key]}
                  onCheckedChange={(v) => setEmailPrefs((p) => ({ ...p, [type.key]: v }))}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4" />
          Guardar preferencias
        </Button>
      </div>
    </div>
  );
}

// ─── Integrations Tab ─────────────────────────────────────────────────────────

function IntegrationsTab() {
  return (
    <div className="space-y-4">
      {[
        {
          name: "Google OAuth",
          description: "Permite iniciar sesión con cuentas de Google",
          icon: "🔑",
          configured: !!(process.env.NEXT_PUBLIC_GOOGLE_CONFIGURED),
          docs: "Configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env",
        },
        {
          name: "Stripe",
          description: "Procesa pagos y sincroniza facturas automáticamente",
          icon: "💳",
          configured: false,
          docs: "Integración de pagos — próximamente",
        },
        {
          name: "Slack",
          description: "Recibe notificaciones en canales de Slack",
          icon: "💬",
          configured: false,
          docs: "Notificaciones vía webhook — próximamente",
        },
        {
          name: "GitHub",
          description: "Vincula commits y PRs con proyectos y tareas",
          icon: "🐙",
          configured: false,
          docs: "Integración de repositorios — próximamente",
        },
      ].map((integration) => (
        <Card key={integration.name}>
          <CardContent className="flex items-center gap-4 p-4">
            <span className="text-3xl">{integration.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{integration.name}</p>
                <Badge variant={integration.configured ? "success" : "secondary"}>
                  {integration.configured ? "Configurado" : "No configurado"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{integration.description}</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{integration.docs}</p>
            </div>
            <Button variant="outline" size="sm" disabled={!integration.configured && integration.name !== "Google OAuth"}>
              {integration.configured ? "Configurar" : "Próximamente"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session } = useSession();

  const isSocio = session?.user?.role === "SOCIO";

  return (
    <div className="flex flex-col h-full">
      <Header
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Configuración" }]}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Configuración</h1>
            <p className="text-sm text-muted-foreground">Administra la plataforma y los accesos</p>
          </div>
        </div>

        {!isSocio && (
          <Card className="border-warning bg-warning/5">
            <CardContent className="flex items-center gap-3 p-4">
              <Shield className="h-5 w-5 text-warning" />
              <p className="text-sm">Solo los socios pueden modificar la configuración de la empresa y gestionar usuarios.</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="empresa">
          <TabsList>
            <TabsTrigger value="empresa">
              <Building2 className="h-4 w-4" />
              Empresa
            </TabsTrigger>
            {isSocio && (
              <TabsTrigger value="usuarios">
                <Users className="h-4 w-4" />
                Usuarios
              </TabsTrigger>
            )}
            <TabsTrigger value="notificaciones">
              <Bell className="h-4 w-4" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="integraciones">
              <Plug className="h-4 w-4" />
              Integraciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="empresa" className="mt-6">
            {isSocio ? <CompanyTab /> : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No tenés permisos para ver esta sección.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {isSocio && (
            <TabsContent value="usuarios" className="mt-6">
              <UsersTab />
            </TabsContent>
          )}

          <TabsContent value="notificaciones" className="mt-6">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="integraciones" className="mt-6">
            <IntegrationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
