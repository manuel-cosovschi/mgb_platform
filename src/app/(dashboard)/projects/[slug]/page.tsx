import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { ProjectBoard } from "@/components/projects/project-board";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await db.project.findUnique({ where: { slug }, select: { name: true } });
  return { title: project?.name ?? "Proyecto" };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  const project = await db.project.findUnique({
    where: { slug },
    include: {
      client: { select: { id: true, name: true, company: true } },
      creator: { select: { id: true, name: true, image: true } },
      members: {
        include: {
          employee: {
            include: { user: { select: { id: true, name: true, image: true } } },
          },
        },
      },
      columns: { orderBy: { order: "asc" } },
      sprints: { orderBy: { startDate: "desc" } },
      milestones: { orderBy: { dueDate: "asc" } },
      _count: { select: { tasks: true } },
    },
  });

  if (!project) notFound();

  // Permisos: clientes solo ven proyectos públicos
  if (session?.user.role === "CLIENTE" && !project.isPublicToClient) {
    notFound();
  }

  // Serialize Decimal fields for client components
  const serializedProject = {
    ...project,
    budget: project.budget ? Number(project.budget) : null,
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        breadcrumbs={[
          { label: "Proyectos", href: "/projects" },
          { label: project.name },
        ]}
      />
      <ProjectBoard project={serializedProject} />
    </div>
  );
}
