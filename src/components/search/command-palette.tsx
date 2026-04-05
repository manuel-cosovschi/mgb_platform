"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator,
} from "@/components/ui/command";
import { Users, FolderOpen, CheckSquare, FileText, Loader2 } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";

interface SearchResults {
  clients: { id: string; name: string; company?: string; email?: string }[];
  projects: { id: string; name: string; slug: string; status: string; client?: { name: string } }[];
  tasks: { id: string; title: string; status: string; project?: { name: string; slug: string } }[];
  documents: { id: string; name: string; type: string }[];
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data, isFetching } = useQuery<SearchResults>({
    queryKey: ["search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { clients: [], projects: [], tasks: [], documents: [] };
      }
      const r = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      return r.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const navigate = useCallback(
    (url: string) => {
      router.push(url);
      onOpenChange(false);
      setQuery("");
    },
    [router, onOpenChange]
  );

  const hasResults =
    (data?.clients?.length || 0) +
      (data?.projects?.length || 0) +
      (data?.tasks?.length || 0) +
      (data?.documents?.length || 0) >
    0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar clientes, proyectos, tareas..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {debouncedQuery.length >= 2 && !isFetching && !hasResults && (
          <CommandEmpty>Sin resultados para &quot;{debouncedQuery}&quot;</CommandEmpty>
        )}

        {isFetching && (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando...
          </div>
        )}

        {!isFetching && data && (
          <>
            {data.clients.length > 0 && (
              <CommandGroup heading="Clientes">
                {data.clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={`client-${client.id}`}
                    onSelect={() => navigate(`/crm`)}
                    className="gap-3"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{client.name}</span>
                      {client.company && (
                        <span className="text-xs text-muted-foreground">{client.company}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {data.projects.length > 0 && (
              <>
                {data.clients.length > 0 && <CommandSeparator />}
                <CommandGroup heading="Proyectos">
                  {data.projects.map((project) => (
                    <CommandItem
                      key={project.id}
                      value={`project-${project.id}`}
                      onSelect={() => navigate(`/projects/${project.slug}`)}
                      className="gap-3"
                    >
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span>{project.name}</span>
                        {project.client?.name && (
                          <span className="text-xs text-muted-foreground">{project.client.name}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {data.tasks.length > 0 && (
              <>
                {(data.clients.length > 0 || data.projects.length > 0) && <CommandSeparator />}
                <CommandGroup heading="Tareas">
                  {data.tasks.map((task) => (
                    <CommandItem
                      key={task.id}
                      value={`task-${task.id}`}
                      onSelect={() =>
                        navigate(task.project?.slug ? `/projects/${task.project.slug}` : "/projects")
                      }
                      className="gap-3"
                    >
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span>{task.title}</span>
                        {task.project?.name && (
                          <span className="text-xs text-muted-foreground">{task.project.name}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {data.documents.length > 0 && (
              <>
                {(data.clients.length > 0 || data.projects.length > 0 || data.tasks.length > 0) && (
                  <CommandSeparator />
                )}
                <CommandGroup heading="Documentos">
                  {data.documents.map((doc) => (
                    <CommandItem
                      key={doc.id}
                      value={`doc-${doc.id}`}
                      onSelect={() => navigate("/documents")}
                      className="gap-3"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{doc.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}

        {/* Quick nav when no query */}
        {!query && (
          <CommandGroup heading="Navegación rápida">
            <CommandItem onSelect={() => navigate("/dashboard")} className="gap-3">
              <span className="text-muted-foreground">→</span> Dashboard
            </CommandItem>
            <CommandItem onSelect={() => navigate("/projects")} className="gap-3">
              <span className="text-muted-foreground">→</span> Proyectos
            </CommandItem>
            <CommandItem onSelect={() => navigate("/crm")} className="gap-3">
              <span className="text-muted-foreground">→</span> CRM / Clientes
            </CommandItem>
            <CommandItem onSelect={() => navigate("/finance")} className="gap-3">
              <span className="text-muted-foreground">→</span> Finanzas
            </CommandItem>
            <CommandItem onSelect={() => navigate("/time-tracking")} className="gap-3">
              <span className="text-muted-foreground">→</span> Control de tiempo
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

// Hook to use command palette globally
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}
