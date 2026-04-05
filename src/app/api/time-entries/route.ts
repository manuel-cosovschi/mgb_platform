import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const week = searchParams.get("week"); // ISO date for any day in the week
  const projectId = searchParams.get("projectId");
  const userId = searchParams.get("userId") ?? session.user.id;
  const running = searchParams.get("running");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: any = {};

  // Non-socios can only see their own entries
  if (session.user.role !== "SOCIO") where.userId = session.user.id;
  else if (userId) where.userId = userId;

  if (week) {
    const anchor = new Date(week);
    where.startTime = {
      gte: startOfWeek(anchor, { weekStartsOn: 1 }),
      lte: endOfWeek(anchor, { weekStartsOn: 1 }),
    };
  }
  if (projectId) where.projectId = projectId;
  if (running === "true") where.isRunning = true;

  const entries = await db.timeEntry.findMany({
    where,
    take: limit,
    orderBy: { startTime: "desc" },
    include: {
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, ...data } = body;

  if (action === "start") {
    // Stop any running entry first
    await db.timeEntry.updateMany({
      where: { userId: session.user.id, isRunning: true },
      data: {
        isRunning: false,
        endTime: new Date(),
        duration: undefined,
      },
    });

    // Find running entries to compute duration
    const running = await db.timeEntry.findMany({
      where: { userId: session.user.id, endTime: null, isRunning: false, startTime: { gte: new Date(Date.now() - 86400000) } },
    });
    for (const r of running) {
      const dur = Math.round((Date.now() - r.startTime.getTime()) / 1000);
      await db.timeEntry.update({ where: { id: r.id }, data: { duration: dur } });
    }

    const entry = await db.timeEntry.create({
      data: {
        userId: session.user.id,
        projectId: data.projectId,
        taskId: data.taskId,
        description: data.description,
        startTime: new Date(),
        isRunning: true,
        isBillable: data.isBillable ?? true,
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    });
    return NextResponse.json(entry, { status: 201 });
  }

  if (action === "stop") {
    const { entryId } = data;
    const entry = await db.timeEntry.findUnique({ where: { id: entryId } });
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const now = new Date();
    const dur = Math.round((now.getTime() - entry.startTime.getTime()) / 1000);
    const updated = await db.timeEntry.update({
      where: { id: entryId },
      data: { isRunning: false, endTime: now, duration: dur },
    });
    return NextResponse.json(updated);
  }

  // Manual entry
  const startTime = new Date(data.startTime);
  const endTime = data.endTime ? new Date(data.endTime) : undefined;
  const duration = endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : undefined;

  const entry = await db.timeEntry.create({
    data: {
      userId: session.user.id,
      projectId: data.projectId,
      taskId: data.taskId,
      description: data.description,
      startTime,
      endTime,
      duration,
      isBillable: data.isBillable ?? true,
      isRunning: false,
    },
    include: {
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
