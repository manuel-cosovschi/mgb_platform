import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Hourly cron: execute CEO project approvals that have passed their 12h deadline
 * with no rejection.
 *
 * Vercel invokes this via the crons config in vercel.json.
 * Protected by CRON_SECRET env variable.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Allow Vercel's internal cron caller (no secret needed in that context)
  // or any caller that provides the correct CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expired = await db.projectApproval.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lte: new Date() },
    },
    select: { id: true, projectId: true, action: true },
  });

  let executed = 0;
  let failed = 0;

  for (const approval of expired) {
    try {
      if (approval.action === "DELETE") {
        await db.project.delete({ where: { id: approval.projectId } });
      } else if (approval.action === "PAUSE") {
        await db.project.update({
          where: { id: approval.projectId },
          data: { status: "ON_HOLD" },
        });
      }
      await db.projectApproval.update({
        where: { id: approval.id },
        data: { status: "EXECUTED" },
      });
      executed++;
    } catch {
      // Project may already be deleted or in an unexpected state
      await db.projectApproval.update({
        where: { id: approval.id },
        data: { status: "CANCELLED" },
      }).catch(() => {});
      failed++;
    }
  }

  return NextResponse.json({ ok: true, checked: expired.length, executed, failed });
}
