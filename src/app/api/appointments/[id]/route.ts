import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED"]).optional(),
  notes: z.string().optional(),
  date: z.string().optional(),
  timeSlot: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = updateSchema.parse(body)

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: { doctor: { include: { user: true } } },
    })
    if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Role-based access: doctor can only update their own appointments
    if (session.user.role === "DOCTOR") {
      if (appointment.doctor.user.id !== session.user.id) {
        return NextResponse.json({ error: "Forbidden — not your appointment" }, { status: 403 })
      }
      // Doctors cannot set status back to PENDING
      if (parsed.status === "PENDING") {
        return NextResponse.json({ error: "Doctors cannot set status to PENDING" }, { status: 400 })
      }
    }

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        ...(parsed.status    && { status: parsed.status }),
        ...(parsed.notes !== undefined && { notes: parsed.notes }),
        ...(parsed.date      && { date: new Date(parsed.date) }),
        ...(parsed.timeSlot  && { timeSlot: parsed.timeSlot }),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "Appointment",
        entityId: params.id,
      },
    })

    return NextResponse.json({ data: updated, message: "Appointment updated" })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const appointment = await prisma.appointment.findUnique({ where: { id: params.id } })
    if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.appointment.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    })

    return NextResponse.json({ message: "Appointment cancelled" })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to cancel appointment" }, { status: 500 })
  }
}
