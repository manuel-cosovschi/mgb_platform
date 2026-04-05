import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "CLIENTE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const department = searchParams.get("department");

  const where: any = {};
  if (search) {
    where.user = { name: { contains: search, mode: "insensitive" } };
  }
  if (department) where.department = department;

  const employees = await db.employee.findMany({
    where,
    orderBy: { startDate: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, isActive: true } },
      manager: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { projectMembers: true } },
    },
  });

  return NextResponse.json(employees);
}
