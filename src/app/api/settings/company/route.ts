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
        name: "MGB Software Factory",
        email: "info@mgbsoftware.com",
        invoicePrefix: "FAC",
        invoiceNextNumber: 1,
        defaultCurrency: "ARS",
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
    name, email, phone, address, website, city, country,
    invoicePrefix, defaultCurrency, logoUrl,
  } = body;

  const settings = await db.companySettings.findFirst();

  if (!settings) {
    const newSettings = await db.companySettings.create({
      data: {
        name: name || "MGB Software Factory",
        email, phone, address, website, city, country,
        invoicePrefix: invoicePrefix || "FAC",
        invoiceNextNumber: 1,
        defaultCurrency: defaultCurrency || "ARS",
        logoUrl,
      },
    });
    return NextResponse.json(newSettings);
  }

  const updated = await db.companySettings.update({
    where: { id: settings.id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(website !== undefined && { website }),
      ...(city !== undefined && { city }),
      ...(country !== undefined && { country }),
      ...(invoicePrefix !== undefined && { invoicePrefix }),
      ...(defaultCurrency !== undefined && { defaultCurrency }),
      ...(logoUrl !== undefined && { logoUrl }),
    },
  });

  return NextResponse.json(updated);
}
