import { NextRequest, NextResponse } from "next/server"
import { matchIntent } from "@/lib/chatbot-intents"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId } = await req.json()
    const intent = matchIntent(message)

    let response = intent.response

    // Handle dynamic fetches
    if (intent.action === "fetch:blood-bank") {
      const bloodBank = await prisma.bloodBank.findMany()
      const summary = bloodBank
        .map((b: { bloodGroup: string; unitsAvailable: number }) =>
          `${b.bloodGroup.replace("_", "").replace("POS", "+").replace("NEG", "-")}: ${b.unitsAvailable} units`
        )
        .join(", ")
      response = `Current blood bank status: ${summary}`
    } else if (intent.action === "fetch:beds") {
      const beds = await prisma.bed.groupBy({
        by: ["type", "status"],
        _count: true,
      })
      const icu = (beds as Array<{ type: string; status: string; _count: number }>)
        .filter(b => b.type === "ICU" && b.status === "AVAILABLE")
        .reduce((a: number, b: { _count: number }) => a + b._count, 0)
      const general = (beds as Array<{ type: string; status: string; _count: number }>)
        .filter(b => b.type === "GENERAL" && b.status === "AVAILABLE")
        .reduce((a: number, b: { _count: number }) => a + b._count, 0)
      response = `Bed availability: ICU — **${icu} available**, General — **${general} available**`
    }

    // Log chat
    await prisma.chatLog.create({
      data: { sessionId: sessionId || "anonymous", message, response, intent: intent.action },
    })

    return NextResponse.json({ data: { response, action: intent.action, chips: intent.chips } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ data: { response: "Sorry, something went wrong. Please try again.", chips: [] } })
  }
}
