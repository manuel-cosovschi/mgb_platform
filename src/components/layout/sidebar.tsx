"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard, FolderKanban, Users, DollarSign,
  UserCircle, FileText, MessageSquare, Calendar,
  Target, BarChart3, Globe, Settings, Timer,
  Building2, ChevronLeft, ChevronRight, LogOut, Moon, Sun,
  X,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SOCIO", "EMPLEADO", "CLIENTE"] },
  { title: "Proyectos", href: "/projects", icon: FolderKanban, roles: ["SOCIO", "EMPLEADO", "CLIENTE"] },
  { title: "CRM", href: "/crm", icon: Users, roles: ["SOCIO", "EMPLEADO"] },
  { title: "Tiempo", href: "/time-tracking", icon: Timer, roles: ["SOCIO", "EMPLEADO"] },
  { title: "Finanzas", href: "/finance", icon: DollarSign, roles: ["SOCIO"] },
  { title: "Empleados", href: "/employees", icon: UserCircle, roles: ["SOCIO"] },
  { title: "Socios", href: "/socios", icon: Building2, roles: ["SOCIO"] },
  { title: "Documentos", href: "/documents", icon: FileText, roles: ["SOCIO", "EMPLEADO", "CLIENTE"] },
  { title: "Chat", href: "/chat", icon: MessageSquare, roles: ["SOCIO", "EMPLEADO"] },
  { title: "Calendario", href: "/calendar", icon: Calendar, roles: ["SOCIO", "EMPLEADO"] },
  { title: "OKRs", href: "/okrs", icon: Target, roles: ["SOCIO", "EMPLEADO"] },
  { title: "Analytics", href: "/analytics", icon: BarChart3, roles: ["SOCIO"] },
  { title: "Portal", href: "/portal", icon: Globe, roles: ["CLIENTE"] },
  { title: "Configuración", href: "/settings", icon: Settings, roles: ["SOCIO"] },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const { mobileOpen, setMobileOpen } = useSidebar();

  // On mobile, always show full (non-collapsed) sidebar
  const isCollapsed = collapsed && !mobileOpen;

  const userRole = session?.user?.role ?? "EMPLEADO";

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-card transition-all duration-300",
        // Desktop: static sidebar
        "hidden md:flex",
        isCollapsed ? "md:w-16" : "md:w-60",
        // Mobile: fixed overlay drawer, always full-width, solid bg, high z-index
        mobileOpen && "!flex fixed inset-y-0 left-0 z-50 w-72 shadow-2xl bg-card",
        className
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center border-b p-4", isCollapsed ? "justify-center" : "gap-3")}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          M
        </div>
        {!isCollapsed && (
          <div className="flex-1">
            <p className="font-semibold text-sm">MGB Hub</p>
            <p className="text-xs text-muted-foreground">Software Factory</p>
          </div>
        )}
        {/* Mobile close button */}
        {mobileOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t p-2 space-y-1">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full", isCollapsed ? "justify-center px-2" : "justify-start gap-3")}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
          {!isCollapsed && <span className="text-sm">Cambiar tema</span>}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full h-auto py-2",
                isCollapsed ? "justify-center px-2" : "justify-start gap-3"
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={session?.user?.image ?? undefined} />
                <AvatarFallback className="text-xs">
                  {initials(session?.user?.name ?? "U")}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{session?.user?.role}</p>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground font-normal">{session?.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/profile">Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">Configuración</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Collapse button — desktop only */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:flex absolute -right-3 top-16 h-6 w-6 rounded-full border bg-background shadow-sm"
        onClick={() => setCollapsed(!collapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>
    </aside>
  );
}
