import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/webhooks/airbyte — Recevoir un webhook Airbyte (protégé par secret)
export async function POST(request: NextRequest) {
  // Vérification du secret partagé avec Airbyte
  const secret = request.headers.get("x-webhook-secret");
  const expectedSecret = process.env.AIRBYTE_WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.error("AIRBYTE_WEBHOOK_SECRET non configuré côté serveur");
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });
  }

  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { eventType, payload } = body as {
      eventType?: string;
      payload?: unknown;
    };

    if (!eventType || typeof eventType !== "string") {
      return NextResponse.json({ error: "eventType requis" }, { status: 400 });
    }

    await prisma.analytics.create({
      data: {
        eventType,
        source: "AIRBYTE",
        payload: JSON.stringify(payload ?? {}),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur webhook Airbyte:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET /api/webhooks/airbyte — Health check (publique)
export async function GET() {
  return NextResponse.json({ ok: true });
}
