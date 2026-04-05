import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Redirigir socios/empleados al dashboard
  if (session.user.role === "SOCIO" || session.user.role === "EMPLEADO") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/portal" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">M</span>
            </div>
            <span className="font-semibold text-sm">MGB Portal</span>
          </Link>

          <nav className="flex items-center gap-1 ml-4">
            <Link href="/portal">
              <Button variant="ghost" size="sm">Inicio</Button>
            </Link>
            <Link href="/portal/projects">
              <Button variant="ghost" size="sm">Proyectos</Button>
            </Link>
            <Link href="/portal/invoices">
              <Button variant="ghost" size="sm">Facturas</Button>
            </Link>
            <Link href="/portal/files">
              <Button variant="ghost" size="sm">Archivos</Button>
            </Link>
          </nav>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{session.user.name}</p>
              <p className="text-xs text-muted-foreground">{session.user.email}</p>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="outline" size="sm" type="submit">Salir</Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
