import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { status } = await req.json()
  const updated = await prisma.bloodRequest.update({ where: { id: params.id }, data: { status, ...(status==="FULFILLED" && { fulfilledAt: new Date() }) } })
  return NextResponse.json({ data: updated })
}
