import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { z } from "zod";

const ALLOWED_ROLES = ["SOCIO", "EMPLEADO"] as const;

const inputSchema = z.object({
  niche: z.string().optional(),
  problem: z.string().optional(),
  market: z.string().optional(),
  budget: z.string().optional(),
  skills: z.string().optional(),
});

// Service layer prepared for AI integration (Anthropic/OpenAI)
// When AI_PROVIDER env is configured, this route will call the LLM
function generateIdeasLocally(input: z.infer<typeof inputSchema>) {
  const base = [
    { title: "SaaS de reservas para barberías", type: "SAAS", description: "Sistema de turnos online para barberías con recordatorios por WhatsApp." },
    { title: "CRM para gimnasios", type: "SAAS", description: "Gestión de socios, pagos recurrentes y planes de entrenamiento." },
    { title: "Tool IA para restaurantes", type: "AI", description: "Generador automático de menús y optimizador de costos con IA." },
    { title: "Sistema de turnos para clínicas", type: "APP", description: "Agendamiento online con integración a WhatsApp y recordatorios automáticos." },
    { title: "Dashboard ventas por WhatsApp", type: "TOOL", description: "Métricas y analytics para equipos de ventas que operan por WhatsApp." },
    { title: "Marketplace de freelancers locales", type: "MARKETPLACE", description: "Plataforma para conectar clientes con freelancers de la región." },
    { title: "App de fidelización para comercios", type: "APP", description: "Sistema de puntos y recompensas para negocios locales." },
    { title: "SaaS de gestión hotelera", type: "SAAS", description: "PMS simplificado para hoteles boutique y bed & breakfasts." },
    { title: "Tool de automatización de redes sociales", type: "TOOL", description: "Programación y análisis de contenido para PYMEs." },
    { title: "Plataforma de e-learning corporativo", type: "ECOMMERCE", description: "Cursos y capacitación interna para empresas medianas." },
  ];

  const niche = input.niche?.toLowerCase() ?? "";
  const problem = input.problem?.toLowerCase() ?? "";

  return base.map((idea, i) => ({
    ...idea,
    revenuePotential: 5 + (i % 5),
    complexity: 3 + (i % 7),
    risk: i % 3 === 0 ? "LOW" : i % 3 === 1 ? "MEDIUM" : "HIGH",
    synergy: 6 + (i % 4),
    timeEstimate: i % 2 === 0 ? "2-3 meses" : "1 mes",
    relatedToNiche: niche ? idea.title.toLowerCase().includes(niche) || idea.description.toLowerCase().includes(niche) : false,
    relatedToProblem: problem ? idea.description.toLowerCase().includes(problem) : false,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    // TODO: Replace with actual AI call when AI_PROVIDER env is set
    // Example: if (process.env.ANTHROPIC_API_KEY) { ... call Claude API ... }
    const ideas = generateIdeasLocally(parsed.data);

    return NextResponse.json({ ideas, source: "local" });
  } catch (error) {
    console.error("[SIDE_PROJECTS_GENERATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
