"use client";

import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { CommandPalette, useCommandPalette } from "@/components/search/command-palette";
import { useSidebar } from "./sidebar-context";

interface HeaderProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function Header({ title, breadcrumbs }: HeaderProps) {
  const { open, setOpen } = useCommandPalette();
  const { setMobileOpen } = useSidebar();
  const { data: notifCount = 0 } = useQuery<number>({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count");
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count;
    },
    refetchInterval: 30_000,
  });

  return (
    <header className="flex h-14 items-center gap-2 sm:gap-4 border-b bg-card px-3 sm:px-6">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-8 w-8 shrink-0"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs / Title */}
      <div className="flex-1 min-w-0">
        {breadcrumbs ? (
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-muted-foreground">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="font-medium text-foreground">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : (
          <h1 className="text-base font-semibold">{title}</h1>
        )}
      </div>

      {/* Search */}
      <div className="relative hidden md:block w-56">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar... (⌘K)"
          className="pl-8 h-9 text-sm cursor-pointer"
          readOnly
          onClick={() => setOpen(true)}
        />
      </div>
      <CommandPalette open={open} onOpenChange={setOpen} />

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {notifCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
              >
                {notifCount > 9 ? "9+" : notifCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notificaciones</span>
            {notifCount > 0 && (
              <Badge variant="secondary" className="text-xs">{notifCount} nuevas</Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifCount === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Sin notificaciones nuevas
            </div>
          ) : (
            <DropdownMenuItem asChild>
              <a href="/notifications" className="justify-center text-sm text-primary">
                Ver todas las notificaciones
              </a>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
