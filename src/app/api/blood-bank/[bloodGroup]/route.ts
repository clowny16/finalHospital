import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: { bloodGroup: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 })
  const { unitsAvailable, unitsReserved } = await req.json()
  const updated = await prisma.bloodBank.update({ where: { bloodGroup: params.bloodGroup }, data: { unitsAvailable, ...(unitsReserved !== undefined && { unitsReserved }), lastUpdated: new Date() } })
  return NextResponse.json({ data: updated })
}
