import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const bloodBank = await prisma.bloodBank.findMany({
      orderBy: { bloodGroup: "asc" },
    })
    return NextResponse.json({ data: bloodBank })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch blood bank data" }, { status: 500 })
  }
}
