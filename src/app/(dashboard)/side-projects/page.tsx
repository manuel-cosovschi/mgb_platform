import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SideProjectsClient } from "./client";

export const metadata: Metadata = { title: "Side Projects Lab" };

export default async function SideProjectsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "CLIENTE") redirect("/portal");

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        breadcrumbs={[{ label: "Side Projects Lab" }]}
      />
      <SideProjectsClient userId={session.user.id} userRole={session.user.role} />
    </div>
  );
}
