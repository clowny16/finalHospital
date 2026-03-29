import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getInitials, formatDate } from "@/lib/utils"
import { Users } from "lucide-react"

export default async function DoctorPatientsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const doctor = await prisma.doctor.findUnique({ where: { userId: session.user.id } })
  if (!doctor) redirect("/login")
  const appts = await prisma.appointment.findMany({
    where: { doctorId: doctor.id },
    include: { patient: { include: { user: true } } },
    orderBy: { date: "desc" },
  })
  const seen = new Map<string, typeof appts[0]>()
  appts.forEach(a => { if (!seen.has(a.patientId)) seen.set(a.patientId, a) })
  const patients = Array.from(seen.values())
  return (
    <div className="space-y-6 pb-8">
      <div><h1 className="page-title">My Patients</h1><p className="text-muted-foreground text-sm mt-1">{patients.length} unique patients</p></div>
      {patients.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-3 opacity-30"/><p>No patients yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map(a => (
            <div key={a.patientId} className="hosapp-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12"><AvatarFallback className="bg-[#0A6EBD] text-white font-bold">{getInitials(a.patient.user.name)}</AvatarFallback></Avatar>
                <div><p className="font-semibold">{a.patient.user.name}</p><p className="text-xs text-muted-foreground">{a.patient.user.email}</p></div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Phone: {a.patient.user.phone || "N/A"}</p>
                <p>Last visit: {formatDate(a.date)}</p>
                {a.reason && <p className="truncate">Reason: {a.reason}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
