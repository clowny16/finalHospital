import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const specialization = searchParams.get("specialization")
    const name = searchParams.get("name")
    const isAvailable = searchParams.get("isAvailable")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (specialization) where.specialization = specialization
    if (isAvailable === "true") where.isAvailable = true
    if (name) {
      where.user = { name: { contains: name } }
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: { user: { select: { name: true, email: true, profileImage: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.doctor.count({ where }),
    ])

    return NextResponse.json({ data: doctors, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 })
  }
}
