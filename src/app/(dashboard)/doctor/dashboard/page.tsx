import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Calendar, Users, Clock, FlaskConical, CheckCircle, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDate, formatTime, getTimeGreeting, getInitials } from "@/lib/utils"
import { startOfDay, endOfDay } from "date-fns"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default async function DoctorDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  })
  if (!doctor) redirect("/login")

  const today = new Date()
  const todayStart = startOfDay(today)
  const todayEnd = endOfDay(today)

  const [todayAppts, pendingLabs, totalPatients] = await Promise.all([
    prisma.appointment.findMany({
      where: { doctorId: doctor.id, date: { gte: todayStart, lte: todayEnd } },
      include: { patient: { include: { user: true } } },
      orderBy: { timeSlot: "asc" },
    }),
    prisma.labReport.findMany({
      where: { doctorId: doctor.id, status: { in: ["PENDING", "IN_PROGRESS"] } },
      include: { patient: { include: { user: true } } },
      take: 5,
    }),
    prisma.appointment.findMany({
      where: { doctorId: doctor.id, status: "COMPLETED" },
      select: { patientId: true },
      distinct: ["patientId"],
    }),
  ])

  const nextAppt = todayAppts.find(a => a.status !== "CANCELLED" && a.status !== "COMPLETED")

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="page-title">{getTimeGreeting()}, Dr. {doctor.user.name.split(" ").slice(-1)[0]} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">{today.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Appointments" value={todayAppts.length} subtitle="Scheduled for today" icon={Calendar} accent="blue" />
        <StatCard title="Pending Lab Reviews" value={pendingLabs.length} subtitle="Awaiting your results" icon={FlaskConical} accent="amber" />
        <StatCard title="Total Patients" value={totalPatients.length} subtitle="Unique patients seen" icon={Users} accent="teal" />
        <StatCard title="Next Appointment" value={nextAppt ? formatTime(nextAppt.timeSlot) : "None Today"} subtitle={nextAppt ? nextAppt.patient.user.name : "Schedule clear"} icon={Clock} accent="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's schedule */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="section-title">Today&apos;s Schedule</CardTitle>
              <Link href="/doctor/appointments"><Button variant="ghost" size="sm" className="text-primary text-xs gap-1">View All <ChevronRight className="h-3.5 w-3.5" /></Button></Link>
            </CardHeader>
            <CardContent>
              {todayAppts.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No appointments scheduled today</p>
                  <p className="text-xs mt-1">Enjoy your free time!</p>
                </div>
              ) : (
                <div className="relative space-y-0">
                  {todayAppts.map((appt, i) => (
                    <div key={appt.id} className="flex gap-4 pb-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${appt.status === "COMPLETED" ? "bg-gray-100 dark:bg-gray-800 text-gray-500" : "medical-gradient text-white"}`}>
                          {formatTime(appt.timeSlot).split(":")[0]}
                        </div>
                        {i < todayAppts.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="hosapp-card p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-muted">{getInitials(appt.patient.user.name)}</AvatarFallback></Avatar>
                              <div>
                                <p className="text-sm font-medium">{appt.patient.user.name}</p>
                                <p className="text-xs text-muted-foreground">{formatTime(appt.timeSlot)} • {appt.type === "TELEMEDICINE" ? "Telemedicine" : "In-Person"}</p>
                              </div>
                            </div>
                            <StatusBadge status={appt.status} />
                          </div>
                          {appt.reason && <p className="text-xs text-muted-foreground mt-2 pl-10">{appt.reason}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Lab Reports */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="section-title">Pending Labs</CardTitle>
              <Link href="/doctor/lab-reports"><Button variant="ghost" size="sm" className="text-primary text-xs gap-1">All <ChevronRight className="h-3.5 w-3.5" /></Button></Link>
            </CardHeader>
            <CardContent>
              {pendingLabs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No pending reviews</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingLabs.map(lr => (
                    <div key={lr.id} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lr.testName}</p>
                        <p className="text-xs text-muted-foreground">{lr.patient.user.name}</p>
                      </div>
                      <StatusBadge status={lr.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
