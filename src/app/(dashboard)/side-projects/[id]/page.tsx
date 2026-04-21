import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { SideProjectDetailClient } from "./client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await db.sideProject.findUnique({ where: { id }, select: { title: true } });
  return { title: project?.title ?? "Side Project" };
}

export default async function SideProjectDetailPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "CLIENTE") redirect("/portal");

  const { id } = await params;

  const project = await db.sideProject.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      links: true,
      tasks: { orderBy: [{ phase: "asc" }, { order: "asc" }] },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true, image: true } } },
      },
      votes: { select: { userId: true, value: true } },
      activityLogs: {
        take: 15,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      _count: { select: { tasks: true, notes: true, votes: true } },
    },
  });

  if (!project) redirect("/side-projects");

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        breadcrumbs={[
          { label: "Side Projects Lab", href: "/side-projects" },
          { label: project.title },
        ]}
      />
      <SideProjectDetailClient
        project={JSON.parse(JSON.stringify(project))}
        userId={session.user.id}
        userRole={session.user.role}
      />
    </div>
  );
}
