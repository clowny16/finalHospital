import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]).optional(),
  patientId: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const summary = searchParams.get("summary") === "true"

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (status) where.status = status

    if (summary) {
      const beds = await prisma.bed.findMany({ select: { type: true, status: true } })
      const result = {
        total: beds.length,
        available: beds.filter(b => b.status === "AVAILABLE").length,
        occupied: beds.filter(b => b.status === "OCCUPIED").length,
        maintenance: beds.filter(b => b.status === "MAINTENANCE").length,
        icuAvailable: beds.filter(b => b.type === "ICU" && b.status === "AVAILABLE").length,
        generalAvailable: beds.filter(b => b.type === "GENERAL" && b.status === "AVAILABLE").length,
      }
      return NextResponse.json({ data: result })
    }

    const beds = await prisma.bed.findMany({
      where,
      include: {
        admissions: {
          where: { dischargedAt: null },
          include: { patient: { include: { user: true } } },
          take: 1,
          orderBy: { admittedAt: "desc" },
        },
      },
      orderBy: [{ floor: "asc" }, { bedNumber: "asc" }],
    })

    return NextResponse.json({ data: beds })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch beds" }, { status: 500 })
  }
}
