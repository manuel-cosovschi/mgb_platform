import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM

  let start: Date, end: Date;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    start = startOfMonth(new Date(y, m - 1));
    end = endOfMonth(new Date(y, m - 1));
  } else {
    start = startOfMonth(new Date());
    end = endOfMonth(new Date());
  }

  const events = await db.calendarEvent.findMany({
    where: {
      OR: [{ startAt: { gte: start, lte: end } }, { isPublic: true, startAt: { gte: start, lte: end } }],
    },
    orderBy: { startAt: "asc" },
    include: {
      attendees: { include: { user: { select: { id: true, name: true, image: true } } } },
    },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const event = await db.calendarEvent.create({
    data: {
      title: body.title,
      description: body.description,
      type: body.type ?? "OTHER",
      startAt: new Date(body.startAt),
      endAt: new Date(body.endAt),
      isAllDay: body.isAllDay ?? false,
      location: body.location,
      color: body.color,
      projectId: body.projectId,
      clientId: body.clientId,
      isPublic: body.isPublic ?? false,
      createdById: session.user.id,
      attendees: body.attendeeIds?.length ? {
        createMany: { data: body.attendeeIds.map((uid: string) => ({ userId: uid })) },
      } : undefined,
    },
    include: {
      attendees: { include: { user: { select: { id: true, name: true, image: true } } } },
    },
  });

  return NextResponse.json(event, { status: 201 });
}
