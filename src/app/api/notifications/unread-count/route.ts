import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ count: 0 });

    const count = await db.notification.count({
      where: { userId: session.user.id, isRead: false },
    });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
