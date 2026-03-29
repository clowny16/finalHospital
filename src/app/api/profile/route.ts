import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { profileUpdateSchema } from "@/lib/validators"
import { z } from "zod"
import bcrypt from "bcryptjs"

// GET /api/profile — fetch current user's full profile
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      patient: true,
      doctor: true,
      admin: true,
    },
  })

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Omit password from response
  const { password: _pw, ...safeUser } = user
  return NextResponse.json({ data: safeUser })
}

// PATCH /api/profile — update name, phone, address, gender, dateOfBirth
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = profileUpdateSchema.parse(body)

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.name,
        phone: parsed.phone ?? null,
        address: parsed.address ?? null,
        gender: parsed.gender ?? null,
        dateOfBirth: parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : null,
      },
      select: {
        id: true, name: true, email: true, phone: true,
        gender: true, dateOfBirth: true, address: true, role: true,
      },
    })

    return NextResponse.json({ data: updated, message: "Profile updated successfully" })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
