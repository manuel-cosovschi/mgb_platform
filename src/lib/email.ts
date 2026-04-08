import nodemailer from "nodemailer";
import { db } from "./db";

async function getTransporter() {
  const settings = await db.companySettings.findFirst();
  if (!settings?.smtpHost || !settings?.smtpUser) return null;

  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort ?? 587,
    secure: (settings.smtpPort ?? 587) === 465,
    auth: { user: settings.smtpUser, pass: settings.smtpPassword ?? "" },
  });
}

export async function sendEmail(to: string | string[], subject: string, html: string) {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.log(`[EMAIL SKIP — no SMTP] To: ${to} | Subject: ${subject}`);
      return { ok: false, reason: "no-smtp" };
    }
    const settings = await db.companySettings.findFirst();
    await transporter.sendMail({
      from: settings?.smtpFrom ?? settings?.smtpUser ?? "noreply@mgb.dev",
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
    });
    return { ok: true };
  } catch (e) {
    console.error("[EMAIL ERROR]", e);
    return { ok: false, reason: String(e) };
  }
}

// ─── Email templates ────────────────────────────────────────────────────────

export function emailBase(content: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; background:#f9fafb; margin:0; padding:24px; }
  .card { background:#fff; border-radius:12px; padding:32px; max-width:600px; margin:0 auto; border:1px solid #e5e7eb; }
  h1 { font-size:20px; margin:0 0 8px; color:#111827; }
  p { font-size:14px; color:#374151; line-height:1.6; }
  table { width:100%; border-collapse:collapse; margin:16px 0; }
  th { background:#f3f4f6; text-align:left; padding:8px 12px; font-size:13px; color:#6b7280; }
  td { padding:8px 12px; border-top:1px solid #f3f4f6; font-size:14px; }
  .btn { display:inline-block; background:#6366f1; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-size:14px; margin-top:16px; }
  .muted { color:#6b7280; font-size:13px; }
  .footer { text-align:center; margin-top:24px; font-size:12px; color:#9ca3af; }
</style></head>
<body><div class="card">${content}<div class="footer">MGB Hub · Software Factory</div></div></body>
</html>`;
}

export function poolCreatedEmail(params: {
  recipientName: string;
  projectName: string;
  projectUrl: string;
  totalBudget: number;
  pool: number;
  currency: string;
  tasks: number;
  points: number;
  value: number;
  participating: boolean;
  participants: string[];
}) {
  if (!params.participating) {
    return emailBase(`
      <h1>ℹ️ Nuevo proyecto: ${params.projectName}</h1>
      <p>Hola ${params.recipientName},</p>
      <p>Se creó el proyecto <strong>${params.projectName}</strong>. No estás asignado como participante.</p>
      <p>Si querés sumarte, pedile al creador que te agregue desde la configuración del proyecto.</p>
      <table><tr><th>Detalle</th><th></th></tr>
        <tr><td>Presupuesto total</td><td>${params.currency} ${params.totalBudget.toFixed(2)}</td></tr>
        <tr><td>Pool distribuible</td><td>${params.currency} ${params.pool.toFixed(2)}</td></tr>
        <tr><td>Participantes</td><td>${params.participants.join(", ")}</td></tr>
      </table>
    `);
  }
  return emailBase(`
    <h1>🚀 Nuevo proyecto: ${params.projectName}</h1>
    <p>Hola ${params.recipientName}, estás asignado como participante.</p>
    <table><tr><th>Detalle</th><th></th></tr>
      <tr><td>Presupuesto total</td><td>${params.currency} ${params.totalBudget.toFixed(2)}</td></tr>
      <tr><td>Pool distribuible</td><td>${params.currency} ${params.pool.toFixed(2)}</td></tr>
      <tr><td>Tu carga inicial</td><td>${params.tasks} tareas · ${params.points} puntos · ~${params.currency} ${params.value.toFixed(2)}</td></tr>
    </table>
    <a class="btn" href="${params.projectUrl}">Ver mis tareas →</a>
  `);
}

export function tasksReleasedEmail(params: {
  recipientName: string;
  releaserName: string;
  projectName: string;
  projectUrl: string;
  tasks: { title: string; points: number; value: number }[];
  totalPoints: number;
  totalValue: number;
  currency: string;
  distribution: { name: string; points: number; value: number; pct: number }[];
}) {
  const rows = params.tasks.map(t =>
    `<tr><td>${t.title}</td><td style="text-align:center">${t.points}</td><td>${params.currency} ${t.value.toFixed(2)}</td></tr>`
  ).join("");
  const distRows = params.distribution.map(d =>
    `<tr><td>${d.name}</td><td style="text-align:center">${d.points} pts</td><td>${params.currency} ${d.value.toFixed(2)}</td><td>${d.pct.toFixed(1)}%</td></tr>`
  ).join("");
  return emailBase(`
    <h1>🔄 ${params.releaserName} liberó tareas</h1>
    <p>Hola ${params.recipientName},</p>
    <p><strong>${params.releaserName}</strong> liberó las siguientes tareas del proyecto <strong>${params.projectName}</strong>:</p>
    <table>
      <tr><th>Tarea</th><th>Puntos</th><th>Valor</th></tr>
      ${rows}
      <tr><td><strong>TOTAL DISPONIBLE</strong></td><td style="text-align:center"><strong>${params.totalPoints}</strong></td><td><strong>${params.currency} ${params.totalValue.toFixed(2)}</strong></td></tr>
    </table>
    <p class="muted">Las tareas están disponibles por orden de llegada.</p>
    <a class="btn" href="${params.projectUrl}">Reclamar tareas →</a>
    <p style="margin-top:24px"><strong>Distribución actual:</strong></p>
    <table>
      <tr><th>Socio</th><th>Puntos</th><th>Valor</th><th>%</th></tr>
      ${distRows}
    </table>
  `);
}

export function taskClaimedEmail(params: {
  recipientName: string;
  claimerName: string;
  taskTitle: string;
  taskValue: number;
  currency: string;
  projectName: string;
  projectUrl: string;
}) {
  return emailBase(`
    <h1>✅ Tarea reclamada</h1>
    <p>Hola ${params.recipientName},</p>
    <p><strong>${params.claimerName}</strong> reclamó la tarea <strong>"${params.taskTitle}"</strong> (${params.currency} ${params.taskValue.toFixed(2)}) en el proyecto <strong>${params.projectName}</strong>.</p>
    <a class="btn" href="${params.projectUrl}">Ver distribución →</a>
  `);
}

export function settlementEmail(params: {
  recipientName: string;
  projectName: string;
  projectUrl: string;
  currency: string;
  details: { name: string; tasks: number; points: number; value: number }[];
}) {
  const rows = params.details.map(d =>
    `<tr><td>${d.name}</td><td style="text-align:center">${d.tasks}</td><td style="text-align:center">${d.points}</td><td><strong>${params.currency} ${d.value.toFixed(2)}</strong></td></tr>`
  ).join("");
  return emailBase(`
    <h1>📋 Liquidación lista para aprobar</h1>
    <p>Hola ${params.recipientName}, el proyecto <strong>${params.projectName}</strong> fue completado. Los 3 socios deben aprobar la liquidación:</p>
    <table>
      <tr><th>Socio</th><th>Tareas</th><th>Puntos</th><th>A cobrar</th></tr>
      ${rows}
    </table>
    <a class="btn" href="${params.projectUrl}?tab=distribucion">Aprobar liquidación →</a>
  `);
}
