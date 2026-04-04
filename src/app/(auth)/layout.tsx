import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session) {
    if (session.user.role === "CLIENTE") {
      redirect("/portal");
    }
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg mb-3">
            M
          </div>
          <h1 className="text-2xl font-bold">MGB Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">Software Factory Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
