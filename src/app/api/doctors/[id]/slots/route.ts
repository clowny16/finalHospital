import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateTimeSlots } from "@/lib/utils"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get("date")
    if (!dateStr) return NextResponse.json({ error: "Date required" }, { status: 400 })

    const doctor = await prisma.doctor.findUnique({ where: { id: params.id } })
    if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 })

    const date = new Date(dateStr)
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" })
    const workingDays = doctor.workingDays.split(",").map((d: string) => d.trim())

    if (!workingDays.includes(dayName)) {
      return NextResponse.json({ data: [] })
    }

    const allSlots = generateTimeSlots(doctor.workingHoursStart, doctor.workingHoursEnd)

    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: params.id,
        date: {
          gte: new Date(date.toDateString()),
          lt: new Date(new Date(date.toDateString()).getTime() + 86400000),
        },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { timeSlot: true },
    })

    const bookedSlots = new Set(bookedAppointments.map((a: { timeSlot: string }) => a.timeSlot))

    const slots = allSlots.map(time => ({
      time,
      available: !bookedSlots.has(time),
    }))

    return NextResponse.json({ data: slots })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 })
  }
}
