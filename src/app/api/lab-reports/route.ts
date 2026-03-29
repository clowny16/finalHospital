import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  patientId: z.string(),
  testName: z.string(),
  testCategory: z.string(),
  remarks: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (session.user.role === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } })
      if (!patient) return NextResponse.json({ data: [], total: 0, page, limit, totalPages: 0 })
      where.patientId = patient.id
    }

    const [reports, total] = await Promise.all([
      prisma.labReport.findMany({
        where,
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
        },
        orderBy: { orderedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.labReport.count({ where }),
    ])

    return NextResponse.json({ data: reports, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch lab reports" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !["DOCTOR", "ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Only doctors or admins can order lab tests" }, { status: 403 })
    }

    const body = await req.json()
    const data = schema.parse(body)

    let doctorId: string | undefined
    if (session.user.role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({ where: { userId: session.user.id } })
      doctorId = doctor?.id
    }

    const report = await prisma.labReport.create({
      data: {
        patientId: data.patientId,
        doctorId,
        testName: data.testName,
        testCategory: data.testCategory,
        remarks: data.remarks,
        status: "PENDING",
      },
      include: { patient: { include: { user: true } } },
    })

    // Notify patient
    await prisma.notification.create({
      data: {
        userId: report.patient.userId,
        title: "Lab Test Ordered",
        message: `A ${data.testName} test has been ordered for you.`,
        type: "lab",
        link: "/patient/lab-reports",
      },
    })

    return NextResponse.json({ data: report, message: "Lab test ordered successfully" })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: "Failed to order lab test" }, { status: 500 })
  }
}
