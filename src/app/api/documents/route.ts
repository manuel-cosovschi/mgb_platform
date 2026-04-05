import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");
  const search = searchParams.get("search");
  const projectId = searchParams.get("projectId");
  const clientId = searchParams.get("clientId");

  const where: any = { isDeleted: false };
  if (folderId === "root") where.folderId = null;
  else if (folderId) where.folderId = folderId;
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (projectId) where.projectId = projectId;
  if (clientId) where.clientId = clientId;

  if (session.user.role === "CLIENTE") {
    where.isPublic = true;
    where.client = { userId: session.user.id };
  }

  const [folders, documents] = await Promise.all([
    db.documentFolder.findMany({
      where: { parentId: folderId === "root" ? null : (folderId ?? null) },
      orderBy: { name: "asc" },
    }),
    db.document.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { uploader: { select: { id: true, name: true } } },
    }),
  ]);

  return NextResponse.json({ folders, documents });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.type === "folder") {
    const folder = await db.documentFolder.create({
      data: { name: body.name, parentId: body.parentId ?? null },
    });
    return NextResponse.json(folder, { status: 201 });
  }

  const doc = await db.document.create({
    data: {
      name: body.name,
      description: body.description,
      type: body.docType ?? "OTHER",
      fileUrl: body.fileUrl,
      fileSize: body.fileSize,
      mimeType: body.mimeType,
      folderId: body.folderId ?? null,
      projectId: body.projectId,
      clientId: body.clientId,
      uploaderId: session.user.id,
      isPublic: body.isPublic ?? false,
    },
    include: { uploader: { select: { id: true, name: true } } },
  });

  await db.auditLog.create({
    data: { userId: session.user.id, action: "CREATE", entity: "Document", entityId: doc.id },
  });

  return NextResponse.json(doc, { status: 201 });
}
