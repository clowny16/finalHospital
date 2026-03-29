import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || !["DOCTOR", "ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()
    const { status, result, normalRange, remarks, reportUrl } = body

    const updated = await prisma.labReport.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(result !== undefined && { result }),
        ...(normalRange !== undefined && { normalRange }),
        ...(remarks !== undefined && { remarks }),
        ...(reportUrl !== undefined && { reportUrl }),
        ...(status === "COMPLETED" && { completedAt: new Date() }),
      },
    })

    return NextResponse.json({ data: updated, message: "Lab report updated" })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to update lab report" }, { status: 500 })
  }
}
