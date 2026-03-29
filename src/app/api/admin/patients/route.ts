import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
export async function GET() {
  const patients = await prisma.patient.findMany({ include: { user: { select: { name: true, email: true, phone: true } } }, orderBy: { createdAt: "desc" } })
  return NextResponse.json({ data: patients })
}
