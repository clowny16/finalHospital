import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  doctorId: z.string(),
  date: z.string(),
  timeSlot: z.string(),
  reason: z.string().optional(),
  type: z.enum(["IN_PERSON", "TELEMEDICINE"]).default("IN_PERSON"),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (session.user.role === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } })
      if (!patient) return NextResponse.json({ data: [], total: 0, page, limit, totalPages: 0 })
      where.patientId = patient.id
    } else if (session.user.role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({ where: { userId: session.user.id } })
      if (!doctor) return NextResponse.json({ data: [], total: 0, page, limit, totalPages: 0 })
      where.doctorId = doctor.id
    }
    if (status) where.status = status

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ])

    return NextResponse.json({ data: appointments, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "PATIENT") {
      return NextResponse.json({ error: "Only patients can book appointments" }, { status: 403 })
    }

    const body = await req.json()
    const data = createSchema.parse(body)

    const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } })
    if (!patient) return NextResponse.json({ error: "Patient profile not found" }, { status: 404 })

    // Check if slot is available
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        date: new Date(data.date),
        timeSlot: data.timeSlot,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    })
    if (existing) {
      return NextResponse.json({ error: "This time slot is already booked" }, { status: 400 })
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: data.doctorId,
        date: new Date(data.date),
        timeSlot: data.timeSlot,
        reason: data.reason,
        type: data.type,
        status: "PENDING",
      },
      include: { doctor: { include: { user: true } } },
    })

    // Notify patient
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: "Appointment Booked",
        message: `Your appointment with Dr. ${appointment.doctor.user.name} has been booked.`,
        type: "appointment",
        link: "/patient/appointments",
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: { userId: session.user.id, action: "CREATE", entity: "Appointment", entityId: appointment.id },
    })

    return NextResponse.json({ data: appointment, message: "Appointment booked successfully" })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: "Failed to book appointment" }, { status: 500 })
  }
}
