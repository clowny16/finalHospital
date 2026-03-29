import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]),
  // Patient fields
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  // Doctor fields
  specialization: z.string().optional(),
  department: z.string().optional(),
  licenseNumber: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.coerce.number().optional(),
  consultationFee: z.coerce.number().optional(),
  // Admin fields
  adminCode: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    const password = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password,
        phone: data.phone,
        role: data.role,
        gender: data.gender,
        address: data.address,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    })

    if (data.role === "PATIENT") {
      await prisma.patient.create({
        data: {
          userId: user.id,
          bloodGroup: data.bloodGroup,
        },
      })
    } else if (data.role === "DOCTOR") {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          specialization: data.specialization || "",
          qualification: data.qualification || "",
          licenseNumber: data.licenseNumber || `LIC-${Date.now()}`,
          department: data.department || "",
          experience: data.experience || 0,
          consultationFee: data.consultationFee || 0,
          workingDays: "Monday,Tuesday,Wednesday,Thursday,Friday",
          workingHoursStart: "09:00",
          workingHoursEnd: "17:00",
        },
      })
    } else if (data.role === "ADMIN") {
      const code = data.adminCode || ""
      if (code !== "HOSAPP-ADMIN-2025") {
        return NextResponse.json({ error: "Invalid admin access code" }, { status: 403 })
      }
      await prisma.admin.create({
        data: { userId: user.id, adminCode: code },
      })
    }

    return NextResponse.json({ message: "Account created successfully", data: { id: user.id, role: user.role } })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
