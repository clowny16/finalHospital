import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  patientName: z.string().min(2),
  bloodGroup: z.string(),
  units: z.coerce.number().min(1),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  hospital: z.string().optional(),
  contactPhone: z.string().min(10),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const request = await prisma.bloodRequest.create({ data })

    return NextResponse.json({ data: request, message: "Blood request submitted successfully" })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const requests = await prisma.bloodRequest.findMany({
      orderBy: { requestedAt: "desc" },
    })
    return NextResponse.json({ data: requests })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 })
  }
}
