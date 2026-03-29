import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { formatTime, parseSQLiteArray } from "@/lib/utils"

export default async function DoctorSchedulePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const doctor = await prisma.doctor.findUnique({ where: { userId: session.user.id } })
  if (!doctor) redirect("/login")

  const days = parseSQLiteArray(doctor.workingDays)

  return (
    <div className="space-y-6 pb-8">
      <div><h1 className="page-title">My Schedule</h1><p className="text-muted-foreground text-sm mt-1">Your working hours and availability</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="section-title">Working Hours</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <Clock className="h-5 w-5 text-[#0A6EBD]" />
              <div><p className="font-semibold text-sm">Consultation Hours</p><p className="text-xs text-muted-foreground">{formatTime(doctor.workingHoursStart)} — {formatTime(doctor.workingHoursEnd)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="section-title">Working Days</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => (
                <span key={day} className={`px-3 py-1.5 rounded-full text-xs font-medium ${days.includes(day) ? "bg-[#0A6EBD] text-white" : "bg-muted text-muted-foreground"}`}>{day.slice(0,3)}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
