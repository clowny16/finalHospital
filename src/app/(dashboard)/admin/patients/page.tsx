import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials, formatDate } from "@/lib/utils"
import { BLOOD_GROUP_LABELS } from "@/lib/constants"

export default async function AdminPatientsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/admin/dashboard")
  const patients = await prisma.patient.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } })
  return (
    <div className="space-y-6 pb-8">
      <div><h1 className="page-title">Patient Directory</h1><p className="text-muted-foreground text-sm">{patients.length} registered patients</p></div>
      <div className="space-y-2">
        {patients.map((p, i) => (
          <div key={p.id} className={`hosapp-card p-4 flex items-center justify-between gap-4 ${i%2===1?"bg-[#F8FAFC] dark:bg-muted/20":""}`}>
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9"><AvatarFallback className="text-xs bg-muted font-semibold">{getInitials(p.user.name)}</AvatarFallback></Avatar>
              <div>
                <p className="font-semibold text-sm">{p.user.name}</p>
                <p className="text-xs text-muted-foreground">{p.user.email} • {p.user.phone || "No phone"}</p>
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground hidden md:block">
              <p>{p.bloodGroup ? BLOOD_GROUP_LABELS[p.bloodGroup] || p.bloodGroup : "N/A"}</p>
              <p>Joined {formatDate(p.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
