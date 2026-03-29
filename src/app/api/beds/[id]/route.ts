import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const body = await req.json()
    const { status, patientId, diagnosis, notes } = body

    const bed = await prisma.bed.findUnique({ where: { id: params.id } })
    if (!bed) return NextResponse.json({ error: "Bed not found" }, { status: 404 })

    await prisma.bed.update({ where: { id: params.id }, data: { status } })

    if (status === "OCCUPIED" && patientId) {
      await prisma.bedAdmission.create({
        data: { bedId: params.id, patientId, diagnosis, notes },
      })
    } else if (status === "AVAILABLE") {
      await prisma.bedAdmission.updateMany({
        where: { bedId: params.id, dischargedAt: null },
        data: { dischargedAt: new Date() },
      })
    }

    await prisma.auditLog.create({
      data: { userId: session.user.id, action: "UPDATE", entity: "Bed", entityId: params.id, details: JSON.stringify({ status }) },
    })

    return NextResponse.json({ message: "Bed updated successfully" })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to update bed" }, { status: 500 })
  }
}
