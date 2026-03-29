import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials, formatDate } from "@/lib/utils"
import { Stethoscope } from "lucide-react"
import { BLOOD_GROUP_LABELS } from "@/lib/constants"

export default async function AdminDoctorsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/admin/dashboard")
  const doctors = await prisma.doctor.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } })
  return (
    <div className="space-y-6 pb-8">
      <div><h1 className="page-title">Doctor Management</h1><p className="text-muted-foreground text-sm">{doctors.length} registered doctors</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map(d => (
          <div key={d.id} className="hosapp-card p-4">
            <div className="flex gap-3 mb-3">
              <Avatar className="h-12 w-12 flex-shrink-0"><AvatarFallback className="bg-[#0A6EBD] text-white font-bold">{getInitials(d.user.name)}</AvatarFallback></Avatar>
              <div>
                <p className="font-semibold">Dr. {d.user.name}</p>
                <p className="text-xs text-muted-foreground">{d.specialization}</p>
                <p className="text-xs text-muted-foreground">{d.department}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/50 rounded-lg p-2"><p className="text-muted-foreground">License</p><p className="font-medium truncate">{d.licenseNumber}</p></div>
              <div className="bg-muted/50 rounded-lg p-2"><p className="text-muted-foreground">Experience</p><p className="font-medium">{d.experience} yrs</p></div>
              <div className="bg-muted/50 rounded-lg p-2"><p className="text-muted-foreground">Consultation</p><p className="font-medium">₹{d.consultationFee}</p></div>
              <div className="bg-muted/50 rounded-lg p-2"><p className="text-muted-foreground">Status</p><p className={`font-medium ${d.isAvailable ? "text-green-600":"text-red-500"}`}>{d.isAvailable?"Available":"Unavailable"}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
