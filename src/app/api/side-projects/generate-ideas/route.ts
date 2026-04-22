import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role === "CLIENTE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, industry, type } = body;

    // Service layer prepared for Claude/OpenAI integration
    // To activate: add ANTHROPIC_API_KEY or OPENAI_API_KEY to .env
    // and uncomment the AI call below

    /*
    if (process.env.ANTHROPIC_API_KEY) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{
            role: "user",
            content: `Generate 5 side project ideas for a software agency. 
            ${prompt ? `Additional context: ${prompt}` : ""}
            ${industry ? `Industry focus: ${industry}` : ""}
            ${type ? `Project type: ${type}` : ""}
            
            Return JSON array with: title, description, problem, solution, targetAudience, type, 
            revenueScore(1-10), easeScore(1-10), synergyScore(1-10), speedScore(1-10), riskScore(1-10),
            tags[], techStack[], emoji`
          }]
        }),
      });
      const data = await response.json();
      return NextResponse.json({ ideas: JSON.parse(data.content[0].text) });
    }
    */

    // Fallback: hardcoded ideas when no AI key is configured
    const ideas = [
      {
        title: "Sistema de Turnos para Barberías",
        description: "App de reservas con panel de barbero, pagos y recordatorios por WhatsApp",
        problem: "Las barberías pierden clientes por esperas largas y cancelaciones",
        solution: "Sistema automatizado de turnos con confirmación por WhatsApp",
        targetAudience: "Barberías y peluquerías",
        type: "SAAS",
        revenueScore: 7, easeScore: 8, synergyScore: 9, speedScore: 7, riskScore: 7,
        tags: ["turnos", "barbería", "whatsapp"],
        techStack: ["Next.js", "Prisma", "WhatsApp API"],
        emoji: "💈",
      },
      {
        title: "Gestión para Gimnasios",
        description: "ERP completo con control de acceso, pagos recurrentes y rutinas personalizadas",
        problem: "Gimnasios usan Excel y pierden la trazabilidad de pagos y asistencia",
        solution: "Plataforma integral con control de acceso NFC y gestión de cobros",
        targetAudience: "Gimnasios y centros de fitness",
        type: "SAAS",
        revenueScore: 8, easeScore: 6, synergyScore: 8, speedScore: 5, riskScore: 6,
        tags: ["gimnasio", "erp", "cobros"],
        techStack: ["Next.js", "PostgreSQL", "Mercado Pago"],
        emoji: "🏋️",
      },
      {
        title: "Menú Digital con IA para Restaurantes",
        description: "Menú interactivo con recomendaciones inteligentes y pedidos desde la mesa",
        problem: "Restaurantes imprimen menús costosos y no pueden actualizarlos fácilmente",
        solution: "QR con menú digital + IA que sugiere platos según preferencias",
        targetAudience: "Restaurantes y bares",
        type: "SAAS",
        revenueScore: 7, easeScore: 7, synergyScore: 7, speedScore: 8, riskScore: 7,
        tags: ["restaurantes", "menú", "ia"],
        techStack: ["Next.js", "OpenAI", "QR"],
        emoji: "🍽️",
      },
      {
        title: "Portal de Pacientes para Clínicas",
        description: "Historia clínica digital, turnos online y recetas electrónicas",
        problem: "Clínicas manejan historias clínicas en papel y turnos por teléfono",
        solution: "Portal web donde pacientes ven su historial, sacan turnos y reciben recetas",
        targetAudience: "Clínicas médicas y consultorios",
        type: "SAAS",
        revenueScore: 9, easeScore: 5, synergyScore: 7, speedScore: 4, riskScore: 5,
        tags: ["salud", "turnos", "historia-clinica"],
        techStack: ["Next.js", "PostgreSQL", "HL7 FHIR"],
        emoji: "🏥",
      },
      {
        title: "Bot de WhatsApp para Atención al Cliente",
        description: "Chatbot inteligente que responde consultas, toma pedidos y escala a humanos",
        problem: "Empresas responden WhatsApp manualmente y pierden ventas fuera de horario",
        solution: "Bot con IA que atiende 24/7 y escala conversaciones complejas",
        targetAudience: "PYMEs con alto volumen de consultas por WhatsApp",
        type: "TOOL",
        revenueScore: 8, easeScore: 6, synergyScore: 9, speedScore: 6, riskScore: 6,
        tags: ["whatsapp", "chatbot", "ia"],
        techStack: ["Node.js", "WhatsApp Business API", "OpenAI"],
        emoji: "🤖",
      },
    ];

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error("[SP_GENERATE_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
