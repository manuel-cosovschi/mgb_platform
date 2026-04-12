"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Plus, TrendingUp, Phone, Mail, MapPin,
  Pencil, Trash2, ChevronDown, X, DollarSign,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Status config ─────────────────────────────────────────────────────────

type ProspectStatus =
  | "POTENTIAL"
  | "CONTACTED"
  | "IN_TALKS"
  | "IN_DEVELOPMENT"
  | "DEPOSIT_PAID"
  | "COMPLETED"
  | "REJECTED";

const STATUS_LABEL: Record<ProspectStatus, string> = {
  POTENTIAL: "Potencial",
  CONTACTED: "Contactado",
  IN_TALKS: "En charlas",
  IN_DEVELOPMENT: "En desarrollo",
  DEPOSIT_PAID: "Seña pagada",
  COMPLETED: "Terminado",
  REJECTED: "Rechazado",
};

const STATUS_CLASS: Record<ProspectStatus, string> = {
  POTENTIAL: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  CONTACTED: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  IN_TALKS: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  IN_DEVELOPMENT: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
  DEPOSIT_PAID: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  COMPLETED: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  REJECTED: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
};

const STATUS_ORDER: ProspectStatus[] = [
  "POTENTIAL", "CONTACTED", "IN_TALKS", "IN_DEVELOPMENT", "DEPOSIT_PAID", "COMPLETED", "REJECTED",
];

const FILTER_TABS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "POTENTIAL", label: "Potencial" },
  { value: "CONTACTED", label: "Contactado" },
  { value: "IN_TALKS", label: "En charlas" },
  { value: "IN_DEVELOPMENT", label: "En desarrollo" },
  { value: "DEPOSIT_PAID", label: "Seña pagada" },
  { value: "COMPLETED", label: "Terminado" },
  { value: "REJECTED", label: "Rechazado" },
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface Prospect {
  id: string;
  businessName: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  service?: string | null;
  status: ProspectStatus;
  notes?: string | null;
  budget?: number | null;
  currency: "ARS" | "USD" | "EUR";
  firstContactAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Form ───────────────────────────────────────────────────────────────────

interface ProspectFormData {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  service: string;
  status: ProspectStatus;
  notes: string;
  budget: string;
  currency: "ARS" | "USD" | "EUR";
}

const EMPTY_FORM: ProspectFormData = {
  businessName: "",
  contactName: "",
  phone: "",
  email: "",
  address: "",
  service: "",
  status: "POTENTIAL",
  notes: "",
  budget: "",
  currency: "ARS",
};

function prospectToForm(p: Prospect): ProspectFormData {
  return {
    businessName: p.businessName,
    contactName: p.contactName ?? "",
    phone: p.phone ?? "",
    email: p.email ?? "",
    address: p.address ?? "",
    service: p.service ?? "",
    status: p.status,
    notes: p.notes ?? "",
    budget: p.budget != null ? String(p.budget) : "",
    currency: p.currency,
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ProspectosPage() {
  const { data: session } = useSession();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ProspectFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Main list query
  const { data, isLoading } = useQuery({
    queryKey: ["prospects", debouncedSearch, statusFilter],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (debouncedSearch) p.set("search", debouncedSearch);
      if (statusFilter) p.set("status", statusFilter);
      p.set("limit", "100");
      const res = await fetch(`/api/prospects?${p}`);
      return res.json() as Promise<{ data: Prospect[]; meta: { total: number } }>;
    },
    staleTime: 0,
  });

  const prospects = data?.data ?? [];

  // ── Duplicate check: show warning if search matches an existing entry ──
  const hasDuplicate =
    debouncedSearch.trim().length >= 2 &&
    prospects.some((p) =>
      p.businessName.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

  // ── Open dialog ──────────────────────────────────────────────────────────

  function openCreate() {
    setEditingProspect(null);
    setForm({ ...EMPTY_FORM, businessName: search });
    setDialogOpen(true);
  }

  function openEdit(p: Prospect) {
    setEditingProspect(p);
    setForm(prospectToForm(p));
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingProspect(null);
    setForm(EMPTY_FORM);
  }

  // ── Save (create or update) ──────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        businessName: form.businessName,
        contactName: form.contactName || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        service: form.service || undefined,
        status: form.status,
        notes: form.notes || undefined,
        currency: form.currency,
        budget: form.budget ? parseFloat(form.budget) : undefined,
      };

      const url = editingProspect
        ? `/api/prospects/${editingProspect.id}`
        : "/api/prospects";
      const method = editingProspect ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Error al guardar");
      await qc.invalidateQueries({ queryKey: ["prospects"] });
      closeDialog();
    } finally {
      setSaving(false);
    }
  }

  // ── Quick status cycle ───────────────────────────────────────────────────

  async function cycleStatus(p: Prospect) {
    const currentIdx = STATUS_ORDER.indexOf(p.status);
    const nextStatus = STATUS_ORDER[(currentIdx + 1) % STATUS_ORDER.length];
    await fetch(`/api/prospects/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    await qc.invalidateQueries({ queryKey: ["prospects"] });
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/prospects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prospects"] }),
  });

  const isSocio = session?.user?.role === "SOCIO";

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen">
      <Header breadcrumbs={[{ label: "Prospectos" }]} />

      <div className="flex-1 p-4 sm:p-6 space-y-4">

        {/* ── Search bar (primary UX) ── */}
        <div className="space-y-2">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscá el negocio antes de contactar..."
              className="pl-9 text-base h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                onClick={() => setSearch("")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Duplicate warning */}
          {hasDuplicate && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm max-w-xl">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                Ya tenés registros que coinciden con "{debouncedSearch}" — revisalos abajo antes de agregar uno nuevo.
              </span>
            </div>
          )}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Status filter tabs */}
          <div className="flex flex-wrap gap-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  statusFilter === tab.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button onClick={openCreate} size="sm" className="ml-auto gap-1.5">
            <Plus className="h-4 w-4" />
            Agregar negocio
          </Button>
        </div>

        {/* ── Count ── */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {prospects.length} resultado{prospects.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* ── List ── */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : prospects.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {debouncedSearch
                ? `Ningún prospecto coincide con "${debouncedSearch}".`
                : "Todavía no cargaste ningún prospecto."}
            </p>
            {debouncedSearch && (
              <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" />
                Agregar "{debouncedSearch}" como nuevo prospecto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {prospects.map((p) => (
              <ProspectCard
                key={p.id}
                prospect={p}
                isSocio={isSocio}
                onEdit={() => openEdit(p)}
                onDelete={() => setDeleteId(p.id)}
                onCycleStatus={() => cycleStatus(p)}
                searchTerm={debouncedSearch}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProspect ? "Editar prospecto" : "Agregar negocio"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="businessName">Nombre del negocio *</Label>
              <Input
                id="businessName"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="La Panadería de Juan"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contactName">Nombre de contacto</Label>
                <Input
                  id="contactName"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  placeholder="Juan Pérez"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+54 9 11..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="juan@panaderia.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="service">Servicio ofrecido</Label>
                <Input
                  id="service"
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                  placeholder="Página web, sistema..."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Dirección / Zona</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Palermo, CABA"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="budget">Presupuesto</Label>
                <Input
                  id="budget"
                  type="number"
                  min={0}
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  placeholder="150000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Moneda</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm({ ...form, currency: v as "ARS" | "USD" | "EUR" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS $</SelectItem>
                    <SelectItem value="USD">USD $</SelectItem>
                    <SelectItem value="EUR">EUR €</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as ProspectStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Aclaraciones, contexto, referencias..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.businessName.trim()}
            >
              {saving ? "Guardando..." : editingProspect ? "Guardar cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ── */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar prospecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteMutation.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Prospect card ───────────────────────────────────────────────────────────

interface CardProps {
  prospect: Prospect;
  isSocio: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCycleStatus: () => void;
  searchTerm: string;
}

function ProspectCard({ prospect: p, isSocio, onEdit, onDelete, onCycleStatus, searchTerm }: CardProps) {
  const currencySymbol = p.currency === "EUR" ? "€" : "$";
  const budgetLabel =
    p.budget != null
      ? `${p.currency} ${currencySymbol}${Number(p.budget).toLocaleString("es-AR")}`
      : null;

  // Highlight matching text
  function highlight(text: string) {
    if (!searchTerm || searchTerm.length < 2) return text;
    const idx = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5">
          {text.slice(idx, idx + searchTerm.length)}
        </mark>
        {text.slice(idx + searchTerm.length)}
      </>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">
              {highlight(p.businessName)}
            </p>
            {p.service && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.service}</p>
            )}
          </div>
          {/* Status badge — click to cycle */}
          <button
            onClick={onCycleStatus}
            title="Clic para avanzar al siguiente estado"
            className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium transition-opacity hover:opacity-80 ${STATUS_CLASS[p.status]}`}
          >
            {STATUS_LABEL[p.status]}
          </button>
        </div>

        {/* Contact details */}
        <div className="space-y-1">
          {p.contactName && (
            <p className="text-xs text-muted-foreground truncate">{p.contactName}</p>
          )}
          {p.phone && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{p.phone}</span>
            </div>
          )}
          {p.email && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{p.email}</span>
            </div>
          )}
          {p.address && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{p.address}</span>
            </div>
          )}
        </div>

        {/* Budget + notes */}
        <div className="flex items-center gap-2">
          {budgetLabel && (
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-3 w-3" />
              {budgetLabel}
            </div>
          )}
          {p.notes && (
            <p className="text-xs text-muted-foreground line-clamp-1 flex-1 italic">
              {p.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 pt-1 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            onClick={onEdit}
          >
            <Pencil className="h-3 w-3" />
            Editar
          </Button>
          {isSocio && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive ml-auto"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
              Eliminar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
