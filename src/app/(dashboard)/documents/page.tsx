"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Folder, FolderOpen, FileText, Image, File, Search,
  Plus, ChevronRight, Home, Upload, Trash2, ExternalLink,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatDate, bytesToHuman } from "@/lib/utils";
import { toast } from "sonner";

function FileIcon({ mimeType }: { mimeType?: string | null }) {
  if (mimeType?.startsWith("image/")) return <Image className="h-8 w-8 text-blue-400" />;
  if (mimeType === "application/pdf") return <FileText className="h-8 w-8 text-red-400" />;
  return <File className="h-8 w-8 text-muted-foreground" />;
}

interface BreadcrumbItem { id: string | null; name: string }

export default function DocumentsPage() {
  const qc = useQueryClient();
  const [folderId, setFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: "Documentos" }]);
  const [search, setSearch] = useState("");
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["documents", folderId, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      else params.set("folderId", folderId ?? "root");
      const res = await fetch(`/api/documents?${params}`);
      return res.json();
    },
  });

  const folders = data?.folders ?? [];
  const documents = data?.documents ?? [];

  function navigateToFolder(id: string | null, name: string) {
    if (id === null) {
      setBreadcrumbs([{ id: null, name: "Documentos" }]);
    } else {
      setBreadcrumbs((prev) => [...prev, { id, name }]);
    }
    setFolderId(id);
  }

  function navigateBreadcrumb(crumb: BreadcrumbItem) {
    const idx = breadcrumbs.findIndex((c) => c.id === crumb.id);
    setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
    setFolderId(crumb.id);
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "folder", name: newFolderName, parentId: folderId }),
    });
    setNewFolderName("");
    setNewFolderOpen(false);
    qc.invalidateQueries({ queryKey: ["documents"] });
    toast.success("Carpeta creada");
  }

  async function deleteDocument(id: string) {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["documents"] });
    toast.success("Documento eliminado");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header breadcrumbs={[{ label: "Documentos" }]} />
      <div className="flex-1 p-4 sm:p-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar documentos..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => setNewFolderOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Carpeta
            </Button>
            <Button size="sm">
              <Upload className="h-4 w-4 mr-1" /> Subir archivo
            </Button>
          </div>
        </div>

        {/* Breadcrumbs */}
        {!search && (
          <div className="flex items-center gap-1 text-sm mb-4 flex-wrap">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.id ?? "root"} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                <button
                  onClick={() => navigateBreadcrumb(crumb)}
                  className={i === breadcrumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground transition-colors"}
                >
                  {i === 0 ? <Home className="h-3.5 w-3.5 inline mr-0.5" /> : null}
                  {crumb.name}
                </button>
              </span>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
          </div>
        ) : (
          <div>
            {/* Folders */}
            {folders.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Carpetas</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {folders.map((folder: any) => (
                    <button
                      key={folder.id}
                      onClick={() => navigateToFolder(folder.id, folder.name)}
                      className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 hover:shadow-md hover:border-primary/50 transition-all group text-center"
                    >
                      <FolderOpen className="h-10 w-10 text-yellow-400 group-hover:text-yellow-300" />
                      <span className="text-xs font-medium truncate w-full">{folder.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {documents.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Archivos</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="group relative flex flex-col items-center gap-2 rounded-lg border bg-card p-4 hover:shadow-md transition-all text-center"
                    >
                      <FileIcon mimeType={doc.mimeType} />
                      <span className="text-xs font-medium truncate w-full" title={doc.name}>{doc.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {doc.fileSize ? bytesToHuman(doc.fileSize) : formatDate(doc.createdAt)}
                      </span>

                      {/* Actions overlay */}
                      <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </a>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteDocument(doc.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!folders.length && !documents.length && (
              <div className="py-16 text-center text-muted-foreground">
                <Folder className="mx-auto h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium">Carpeta vacía</p>
                <p className="text-sm mt-1">Subí archivos o creá una carpeta para comenzar.</p>
              </div>
            )}
          </div>
        )}

        {/* New folder dialog */}
        <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Nueva carpeta</DialogTitle></DialogHeader>
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                autoFocus
                placeholder="Nombre de la carpeta..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createFolder(); }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewFolderOpen(false)}>Cancelar</Button>
              <Button onClick={createFolder} disabled={!newFolderName.trim()}>Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
