import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  organs: z.string().min(1),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "PATIENT") {
      return NextResponse.json({ error: "Only patients can register" }, { status: 403 })
    }

    const body = await req.json()
    const data = schema.parse(body)

    const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } })
    if (!patient) return NextResponse.json({ error: "Patient profile not found" }, { status: 404 })

    // Check if already registered
    const existing = await prisma.organDonation.findFirst({
      where: { patientId: patient.id, status: { not: "COMPLETED" } },
    })
    if (existing) return NextResponse.json({ error: "Already registered as organ donor" }, { status: 400 })

    const donation = await prisma.organDonation.create({
      data: { patientId: patient.id, organs: data.organs, notes: data.notes },
    })

    return NextResponse.json({ data: donation, message: "Registered as organ donor successfully" })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: "Failed to register" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } })
    if (!patient) return NextResponse.json({ data: null })

    const donation = await prisma.organDonation.findFirst({
      where: { patientId: patient.id },
      orderBy: { registeredAt: "desc" },
    })

    return NextResponse.json({ data: donation })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch donation status" }, { status: 500 })
  }
}
