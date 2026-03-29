import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Calendar, FlaskConical, Bell, Droplets, ChevronRight, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate, formatTime, getTimeGreeting, getInitials } from "@/lib/utils"
import { BLOOD_GROUP_LABELS } from "@/lib/constants"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"


export default async function PatientDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  })
  if (!patient) redirect("/login")

  const [appointments, labReports, notifications] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId: patient.id, status: { in: ["PENDING", "CONFIRMED"] } },
      include: { doctor: { include: { user: true } } },
      orderBy: { date: "asc" },
      take: 5,
    }),
    prisma.labReport.findMany({
      where: { patientId: patient.id },
      orderBy: { orderedAt: "desc" },
      take: 3,
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id, isRead: false },
    }),
  ])

  const nextAppt = appointments[0]
  const pendingLabs = labReports.filter((r: { status: string }) => r.status === "PENDING" || r.status === "IN_PROGRESS").length

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="page-title">{getTimeGreeting()}, {patient.user.name.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Next Appointment"
          value={nextAppt ? formatDate(nextAppt.date) : "None"}
          subtitle={nextAppt ? `Dr. ${nextAppt.doctor.user.name.split(" ").slice(-1)[0]}` : "Book one today"}
          icon={Calendar}
          accent="blue"
        />
        <StatCard
          title="Pending Lab Reports"
          value={pendingLabs}
          subtitle={pendingLabs === 0 ? "All clear!" : "Awaiting results"}
          icon={FlaskConical}
          accent="amber"
        />
        <StatCard
          title="Notifications"
          value={notifications.length}
          subtitle={notifications.length === 0 ? "You're all caught up" : "Unread alerts"}
          icon={Bell}
          accent="teal"
        />
        <StatCard
          title="Blood Group"
          value={patient.bloodGroup ? (BLOOD_GROUP_LABELS[patient.bloodGroup] || patient.bloodGroup) : "N/A"}
          subtitle="Your blood type"
          icon={Droplets}
          accent="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="section-title">Upcoming Appointments</CardTitle>
              <Link href="/patient/appointments" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No upcoming appointments.</p>
                  <Link href="/patient/appointments"><Button size="sm" className="mt-3 bg-[#0A6EBD] hover:bg-[#0957a0]">Book Appointment</Button></Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {appointments.slice(0, 3).map((appt: typeof appointments[0], i: number) => (
                    <div key={appt.id} className={`flex items-center justify-between py-3 ${i % 2 === 1 ? "table-row-even -mx-6 px-6" : ""}`}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-blue-100 text-[#0A6EBD] font-semibold">
                            {getInitials(appt.doctor.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">Dr. {appt.doctor.user.name}</p>
                          <p className="text-xs text-muted-foreground">{appt.doctor.specialization}</p>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">{formatDate(appt.date)}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(appt.timeSlot)}</p>
                      </div>
                      <StatusBadge status={appt.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Lab Reports */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="section-title">Recent Lab Reports</CardTitle>
              <Link href="/patient/lab-reports" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {labReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FlaskConical className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No lab reports found.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {labReports.map((lr: typeof labReports[0], i: number) => (
                    <div key={lr.id} className={`flex items-center justify-between py-3 ${i % 2 === 1 ? "table-row-even -mx-6 px-6" : ""}`}>
                      <div>
                        <p className="text-sm font-medium">{lr.testName}</p>
                        <p className="text-xs text-muted-foreground">{lr.testCategory} • {formatDate(lr.orderedAt)}</p>
                      </div>
                      <StatusBadge status={lr.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="section-title">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { label: "Book Appointment", href: "/patient/appointments", icon: Calendar, color: "bg-blue-50 dark:bg-blue-950/30 text-[#0A6EBD]" },
                { label: "Lab Reports", href: "/patient/lab-reports", icon: FlaskConical, color: "bg-amber-50 dark:bg-amber-950/30 text-[#F4A261]" },
                { label: "Blood Bank", href: "/patient/blood-bank", icon: Droplets, color: "bg-red-50 dark:bg-red-950/30 text-[#E63946]" },
                { label: "Organ Donation", href: "/patient/organ-donation", icon: Bell, color: "bg-teal-50 dark:bg-teal-950/30 text-[#00B4A6]" },
              ].map(({ label, href, icon: Icon, color }) => (
                <Link key={label} href={href} className="hosapp-card p-4 text-center group cursor-pointer">
                  <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium leading-tight">{label}</p>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Health Awareness Banner */}
          <div className="rounded-xl overflow-hidden teal-gradient p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-1">Health Tip</p>
            <p className="font-bold text-base leading-snug mb-2">Regular health checkups can prevent 80% of diseases.</p>
            <p className="text-sm opacity-80">Schedule your annual checkup today to stay ahead of your health.</p>
            <Link href="/patient/appointments">
              <Button size="sm" className="mt-3 bg-white/20 hover:bg-white/30 text-white border-0">
                Book Checkup
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
