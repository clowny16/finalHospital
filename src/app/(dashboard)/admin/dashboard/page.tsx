"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/shared/StatCard"
import { Users, Calendar, BedDouble, Droplets, FlaskConical, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { timeAgo } from "@/lib/utils"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"

interface Stats {
  totalPatients: number
  appointmentsToday: number
  bedOccupancyPct: number
  totalBloodUnits: number
  pendingLabReports: number
  appointmentsChart: { date: string; count: number }[]
  bedsByType: { type: string; available: number; occupied: number }[]
  bloodBank: { group: string; units: number }[]
  deptAppointments: { name: string; value: number }[]
  recentActivity: { action: string; entity: string; createdAt: string }[]
}

const DEPT_COLORS = ["#0A6EBD", "#00B4A6", "#E63946", "#F4A261", "#2DC653", "#7c3aed", "#db2777", "#059669"]

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [clock, setClock] = useState(new Date())

  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t) }, [])

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/stats")
      const d = await res.json()
      setStats(d.data)
    } catch { /* silently fail */ }
    setLoading(false)
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Hospital Overview</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono tabular-nums">
            {clock.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} — {clock.toLocaleTimeString("en-IN")}
          </p>
        </div>
        <button onClick={loadStats} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-1">
          <RefreshCw className="h-3.5 w-3.5" />Refresh
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? [1,2,3,4,5].map(i => <StatCard key={i} title="" value="" icon={Users} loading />) : (
          <>
            <StatCard title="Total Patients" value={stats?.totalPatients ?? 0} subtitle="Registered" icon={Users} accent="blue" />
            <StatCard title="Appointments Today" value={stats?.appointmentsToday ?? 0} subtitle="Scheduled" icon={Calendar} accent="teal" />
            <StatCard title="Bed Occupancy" value={`${stats?.bedOccupancyPct ?? 0}%`} subtitle="Of total beds" icon={BedDouble} accent="amber" />
            <StatCard title="Blood Units" value={stats?.totalBloodUnits ?? 0} subtitle="Total available" icon={Droplets} accent="red" />
            <StatCard title="Pending Labs" value={stats?.pendingLabReports ?? 0} subtitle="Awaiting results" icon={FlaskConical} accent="green" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Line Chart */}
        <Card>
          <CardHeader><CardTitle className="section-title">Appointments — Last 30 Days</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-52 w-full rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats?.appointmentsChart || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#0A6EBD" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bed Occupancy Bar Chart */}
        <Card>
          <CardHeader><CardTitle className="section-title">Bed Occupancy by Type</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-52 w-full rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats?.bedsByType || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="available" fill="#2DC653" radius={[4,4,0,0]} />
                  <Bar dataKey="occupied" fill="#E63946" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Blood Bank */}
        <Card>
          <CardHeader><CardTitle className="section-title">Blood Bank Levels</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-52 w-full rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats?.bloodBank || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="group" type="category" tick={{ fontSize: 10 }} width={32} />
                  <Tooltip />
                  <Bar dataKey="units" fill="#E63946" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Department Pie Chart */}
        <Card>
          <CardHeader><CardTitle className="section-title">Appointments by Department</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-52 w-full rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats?.deptAppointments || []} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                    {(stats?.deptAppointments || []).map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader><CardTitle className="section-title">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-10 rounded-lg"/>)}</div>
          : (stats?.recentActivity || []).length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
          : (
            <div className="divide-y divide-border">
              {(stats?.recentActivity || []).map((a, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#0A6EBD]" />
                    <p className="text-sm"><span className="font-medium">{a.action}</span> — {a.entity}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
