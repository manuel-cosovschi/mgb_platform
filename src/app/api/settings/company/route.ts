import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let settings = await db.companySettings.findFirst();

  if (!settings) {
    settings = await db.companySettings.create({
      data: {
        companyName: "MGB Software Factory",
        email: "info@mgbsoftware.com",
        invoicePrefix: "FAC",
        invoiceNextNumber: 1,
        taxRate: 21,
        currency: "EUR",
      },
    });
  }

  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "SOCIO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const {
    companyName, email, phone, address, website,
    invoicePrefix, taxRate, currency, logoUrl,
  } = body;

  const settings = await db.companySettings.findFirst();

  if (!settings) {
    const newSettings = await db.companySettings.create({
      data: {
        companyName: companyName || "MGB Software Factory",
        email: email || "",
        phone, address, website,
        invoicePrefix: invoicePrefix || "FAC",
        invoiceNextNumber: 1,
        taxRate: taxRate ? parseFloat(taxRate) : 21,
        currency: currency || "EUR",
        logoUrl,
      },
    });
    return NextResponse.json(newSettings);
  }

  const updated = await db.companySettings.update({
    where: { id: settings.id },
    data: {
      ...(companyName !== undefined && { companyName }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(website !== undefined && { website }),
      ...(invoicePrefix !== undefined && { invoicePrefix }),
      ...(taxRate !== undefined && { taxRate: parseFloat(taxRate) }),
      ...(currency !== undefined && { currency }),
      ...(logoUrl !== undefined && { logoUrl }),
    },
  });

  return NextResponse.json(updated);
}
