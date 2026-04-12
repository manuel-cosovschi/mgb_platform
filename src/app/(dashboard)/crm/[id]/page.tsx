"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Building2, Mail, Phone, MapPin, Globe, ExternalLink,
  Plus, Calendar, Clock, FileText, Pencil, Tag,
  Briefcase, MessageSquare, PhoneCall, AtSign, Users,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { initials, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

// ─── Config ──────────────────────────────────────────────────────────────────

const STAGES = [
  { id: "LEAD", label: "Lead", variant: "secondary" },
  { id: "CONTACTED", label: "Contactado", variant: "info" },
  { id: "PROPOSAL_SENT", label: "Propuesta enviada", variant: "warning" },
  { id: "NEGOTIATION", label: "Negociación", variant: "purple" },
  { id: "WON", label: "Ganado", variant: "success" },
  { id: "LOST", label: "Perdido", variant: "destructive" },
] as const;

const SCORES = [
  { id: "HIGH", label: "Alta prioridad", color: "text-emerald-500" },
  { id: "MEDIUM", label: "Media prioridad", color: "text-yellow-500" },
  { id: "LOW", label: "Baja prioridad", color: "text-slate-400" },
] as const;

const INTERACTION_TYPES = [
  { id: "CALL", label: "Llamada", icon: PhoneCall },
  { id: "EMAIL", label: "Email", icon: Mail },
  { id: "MEETING", label: "Reunión", icon: Users },
  { id: "NOTE", label: "Nota", icon: FileText },
  { id: "WHATSAPP", label: "WhatsApp", icon: MessageSquare },
  { id: "OTHER", label: "Otro", icon: AtSign },
] as const;

const PROJECT_STATUS: Record<string, { label: string; variant: string }> = {
  PLANNING: { label: "Planificación", variant: "info" },
  ACTIVE: { label: "Activo", variant: "success" },
  ON_HOLD: { label: "En pausa", variant: "warning" },
  COMPLETED: { label: "Completado", variant: "success" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
};

function stageVariant(id: string) {
  return STAGES.find((s) => s.id === id)?.variant ?? "secondary";
}
function stageLabel(id: string) {
  return STAGES.find((s) => s.id === id)?.label ?? id;
}
function scoreInfo(id: string) {
  return SCORES.find((s) => s.id === id) ?? SCORES[1];
}
function interactionIcon(type: string) {
  return INTERACTION_TYPES.find((t) => t.id === type)?.icon ?? FileText;
}
function interactionLabel(type: string) {
  return INTERACTION_TYPES.find((t) => t.id === type)?.label ?? type;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => setClientId(id));
  }, [params]);

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!clientId,
  });

  if (!clientId || isLoading) return <LoadingSkeleton />;
  if (!client) return <div className="p-8 text-center text-muted-foreground">Cliente no encontrado.</div>;

  return (
    <ClientDetail
      client={client}
      onMutate={() => queryClient.invalidateQueries({ queryKey: ["client", clientId] })}
      onDeleted={() => router.push("/crm")}
    />
  );
}

// ─── Main detail view ────────────────────────────────────────────────────────

function ClientDetail({
  client,
  onMutate,
  onDeleted,
}: {
  client: any;
  onMutate: () => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [addingInteraction, setAddingInteraction] = useState(false);
  const score = scoreInfo(client.score);

  async function handleStageChange(stage: string) {
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (res.ok) { toast.success("Etapa actualizada"); onMutate(); }
    else toast.error("Error al actualizar");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        breadcrumbs={[
          { label: "CRM", href: "/crm" },
          { label: client.name },
        ]}
      />

      <div className="flex-1 p-4 sm:p-6 space-y-5 max-w-4xl mx-auto w-full">
        {/* ── Profile card ── */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 shrink-0">
                <AvatarFallback className="text-lg">{initials(client.name)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h1 className="text-xl font-bold">{client.name}</h1>
                    {client.company && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {client.company}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={(stageVariant(client.stage)) as any}>
                      {stageLabel(client.stage)}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>

                <p className={`text-sm font-medium mt-2 ${score.color}`}>
                  ● {score.label}
                </p>

                {client.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {client.tags.map((tag: string) => (
                      <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stage selector */}
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-1.5">Mover etapa</p>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleStageChange(s.id)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      client.stage === s.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Contact info + notes ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  {client.email}
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  {client.phone}
                </a>
              )}
              {(client.address || client.city) && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {[client.address, client.city, client.country].filter(Boolean).join(", ")}
                </p>
              )}
              {client.website && (
                <a href={client.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Globe className="h-4 w-4 shrink-0" />
                  {client.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              {client.linkedin && (
                <a href={client.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  LinkedIn
                </a>
              )}
              {!client.email && !client.phone && !client.website && !client.address && (
                <p className="text-muted-foreground text-xs">Sin datos de contacto.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {client.industry && (
                <p className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> {client.industry}</p>
              )}
              {client.companySize && (
                <p className="flex items-center gap-2"><Users className="h-4 w-4" /> {client.companySize} empleados</p>
              )}
              {client.taxId && (
                <p className="flex items-center gap-2"><FileText className="h-4 w-4" /> CUIT/RUT: {client.taxId}</p>
              )}
              {!client.industry && !client.companySize && !client.taxId && (
                <p className="text-xs">Sin datos de empresa.</p>
              )}
              {client.notes && (
                <>
                  <Separator className="my-2" />
                  <p className="text-xs text-foreground whitespace-pre-wrap">{client.notes}</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Projects ── */}
        {client.projects?.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Proyectos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.projects.map((p: any) => {
                const s = PROJECT_STATUS[p.status] ?? PROJECT_STATUS.PLANNING;
                return (
                  <Link
                    key={p.id}
                    href={`/projects/${p.slug}`}
                    className="flex items-center justify-between p-2.5 rounded-md border hover:bg-muted transition-colors text-sm"
                  >
                    <span className="font-medium">{p.name}</span>
                    <Badge variant={s.variant as any} className="text-xs">{s.label}</Badge>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* ── Interactions ── */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Interacciones ({client._count?.interactions ?? 0})
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setAddingInteraction(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Agregar
            </Button>
          </CardHeader>
          <CardContent>
            {client.interactions?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay interacciones registradas.
              </p>
            ) : (
              <div className="space-y-3">
                {client.interactions?.map((interaction: any) => {
                  const Icon = interactionIcon(interaction.type);
                  return (
                    <div key={interaction.id} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 p-1.5 rounded-md bg-muted">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{interaction.title}</span>
                          <span className="text-xs text-muted-foreground">{interactionLabel(interaction.type)}</span>
                        </div>
                        {interaction.description && (
                          <p className="text-muted-foreground mt-0.5 text-xs line-clamp-2">
                            {interaction.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(interaction.date)}
                          {interaction.duration && (
                            <><Clock className="h-3 w-3 ml-2" />{interaction.duration} min</>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Edit dialog ── */}
      {editing && (
        <EditClientDialog
          client={client}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); onMutate(); }}
        />
      )}

      {/* ── Add interaction dialog ── */}
      {addingInteraction && (
        <AddInteractionDialog
          clientId={client.id}
          onClose={() => setAddingInteraction(false)}
          onSaved={() => { setAddingInteraction(false); onMutate(); }}
        />
      )}
    </div>
  );
}

// ─── Edit dialog ─────────────────────────────────────────────────────────────

function EditClientDialog({ client, onClose, onSaved }: { client: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: client.name ?? "",
    company: client.company ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    address: client.address ?? "",
    city: client.city ?? "",
    country: client.country ?? "",
    website: client.website ?? "",
    linkedin: client.linkedin ?? "",
    industry: client.industry ?? "",
    companySize: client.companySize ?? "",
    taxId: client.taxId ?? "",
    notes: client.notes ?? "",
    score: client.score ?? "MEDIUM",
    tags: client.tags?.join(", ") ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Cliente actualizado"); onSaved(); }
    else toast.error("Error al guardar");
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {[
            { key: "name", label: "Nombre *" },
            { key: "company", label: "Empresa" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Teléfono" },
            { key: "taxId", label: "CUIT / RUT" },
            { key: "address", label: "Dirección" },
            { key: "city", label: "Ciudad" },
            { key: "country", label: "País" },
            { key: "website", label: "Sitio web" },
            { key: "linkedin", label: "LinkedIn" },
            { key: "industry", label: "Industria" },
            { key: "companySize", label: "Tamaño empresa" },
            { key: "tags", label: "Etiquetas (separadas por coma)" },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label>{label}</Label>
              <Input
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}

          <div className="space-y-1">
            <Label>Prioridad</Label>
            <Select value={form.score} onValueChange={(v) => setForm({ ...form, score: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SCORES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Notas</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add interaction dialog ───────────────────────────────────────────────────

function AddInteractionDialog({ clientId, onClose, onSaved }: { clientId: string; onClose: () => void; onSaved: () => void }) {
  const now = new Date();
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const [form, setForm] = useState({
    type: "NOTE" as string,
    title: "",
    description: "",
    date: localIso,
    duration: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.title.trim()) { toast.error("El título es requerido"); return; }
    setSaving(true);
    const res = await fetch(`/api/clients/${clientId}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        date: new Date(form.date).toISOString(),
        duration: form.duration ? parseInt(form.duration) : undefined,
      }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Interacción registrada"); onSaved(); }
    else toast.error("Error al guardar");
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva interacción</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INTERACTION_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Título *</Label>
            <Input
              placeholder="Ej: Llamada de seguimiento"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Fecha</Label>
            <Input
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Duración (minutos)</Label>
            <Input
              type="number"
              placeholder="Opcional"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Notas</Label>
            <Textarea
              placeholder="Detalles de la interacción..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header breadcrumbs={[{ label: "CRM", href: "/crm" }, { label: "..." }]} />
      <div className="flex-1 p-4 sm:p-6 space-y-5 max-w-4xl mx-auto w-full">
        <Card><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card><CardContent className="p-5"><Skeleton className="h-32 w-full" /></CardContent></Card>
          <Card><CardContent className="p-5"><Skeleton className="h-32 w-full" /></CardContent></Card>
        </div>
        <Card><CardContent className="p-5"><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    </div>
  );
}
