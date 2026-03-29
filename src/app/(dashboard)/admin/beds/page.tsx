"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/shared/StatCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { BedDouble, UserPlus, RefreshCw, Search } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatDate, getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Patient { id: string; user: { name: string } }
interface Bed {
  id: string; bedNumber: string; ward: string; floor: number; type: string; status: string; features: string
  admissions?: { id: string; admittedAt: string; diagnosis?: string | null; patient?: { user: { name: string } } }[]
}

const BED_TYPE_COLORS: Record<string, string> = {
  ICU: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  GENERAL: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  EMERGENCY: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
  PRIVATE: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
}

export default function AdminBedsPage() {
  const [beds, setBeds] = useState<Bed[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [admitBed, setAdmitBed] = useState<Bed | null>(null)
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [patientSearch, setPatientSearch] = useState("")

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterType !== "all") params.set("type", filterType)
    if (filterStatus !== "all") params.set("status", filterStatus)
    const [bedsRes, patientsRes] = await Promise.all([
      fetch(`/api/beds?${params}`).then(r => r.json()),
      fetch("/api/admin/patients").then(r => r.json()),
    ])
    setBeds(bedsRes.data || [])
    setPatients(patientsRes.data || [])
    setLastUpdated(new Date())
    setSecondsAgo(0)
    setLoading(false)
  }, [filterType, filterStatus])

  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setInterval(() => setSecondsAgo(s => s + 1), 1000); return () => clearInterval(t) }, [])
  useEffect(() => {
    const t = setInterval(() => load(), 30000)
    return () => clearInterval(t)
  }, [load])

  const updateBed = async (bedId: string, status: string, patientData?: { patientId: string; diagnosis: string; notes: string }) => {
    setSaving(true)
    const res = await fetch(`/api/beds/${bedId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...patientData }),
    })
    if (res.ok) { toast.success(`Bed ${status === "AVAILABLE" ? "discharged" : status === "MAINTENANCE" ? "marked for maintenance" : "updated"}`); load(); setAdmitBed(null) }
    else toast.error("Failed to update bed")
    setSaving(false)
  }

  const stats = {
    total: beds.length,
    icuAvail: beds.filter(b => b.type === "ICU" && b.status === "AVAILABLE").length,
    generalAvail: beds.filter(b => b.type === "GENERAL" && b.status === "AVAILABLE").length,
    occupied: beds.filter(b => b.status === "OCCUPIED").length,
    maintenance: beds.filter(b => b.status === "MAINTENANCE").length,
  }

  const filteredPatients = patients.filter(p => p.user.name.toLowerCase().includes(patientSearch.toLowerCase()))

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Bed Management</h1><p className="text-muted-foreground text-sm mt-1">Real-time bed availability and patient admissions</p></div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-1">
          <RefreshCw className="h-3.5 w-3.5" /><span>Updated {secondsAgo}s ago</span>
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        <StatCard title="Total Beds" value={stats.total} icon={BedDouble} accent="blue" />
        <StatCard title="ICU Available" value={stats.icuAvail} icon={BedDouble} accent="red" />
        <StatCard title="General Avail." value={stats.generalAvail} icon={BedDouble} accent="green" />
        <StatCard title="Occupied" value={stats.occupied} icon={BedDouble} accent="amber" />
        <StatCard title="Maintenance" value={stats.maintenance} icon={BedDouble} accent="teal" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Bed Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="ICU">ICU</SelectItem>
            <SelectItem value="GENERAL">General</SelectItem>
            <SelectItem value="EMERGENCY">Emergency</SelectItem>
            <SelectItem value="PRIVATE">Private</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="OCCUPIED">Occupied</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bed Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">{[...Array(12)].map((_,i) => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {beds.map(bed => {
            const currentAdmission = bed.admissions?.[0]
            return (
              <div key={bed.id} className={cn("hosapp-card p-3 text-sm", bed.status === "OCCUPIED" && "border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/10")}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-base">{bed.bedNumber}</p>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", BED_TYPE_COLORS[bed.type] || "bg-muted text-muted-foreground")}>{bed.type}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Floor {bed.floor} • {bed.ward}</p>
                <StatusBadge status={bed.status} className="mb-2" />
                {bed.status === "OCCUPIED" && currentAdmission?.patient && (
                  <p className="text-xs font-medium text-foreground mt-1 truncate">{currentAdmission.patient.user.name}</p>
                )}
                {bed.status === "OCCUPIED" && currentAdmission && (
                  <p className="text-xs text-muted-foreground">since {formatDate(currentAdmission.admittedAt)}</p>
                )}
                <div className="mt-2 space-y-1.5">
                  {bed.status === "AVAILABLE" && (
                    <Button size="sm" className="w-full h-7 text-xs bg-[#0A6EBD] hover:bg-[#0957a0]" onClick={() => setAdmitBed(bed)}>
                      <UserPlus className="h-3 w-3 mr-1" />Admit
                    </Button>
                  )}
                  {bed.status === "OCCUPIED" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="w-full h-7 text-xs">Discharge</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Discharge Patient?</AlertDialogTitle>
                          <AlertDialogDescription>Discharge {currentAdmission?.patient?.user.name} from Bed {bed.bedNumber}?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => updateBed(bed.id, "AVAILABLE")} className="bg-destructive">Discharge</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {bed.status === "MAINTENANCE" && (
                    <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => updateBed(bed.id, "AVAILABLE")}>Mark Available</Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Admit Patient Sheet */}
      <Sheet open={!!admitBed} onOpenChange={() => setAdmitBed(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>Admit Patient — Bed {admitBed?.bedNumber}</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Search Patient</Label>
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Patient name..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} /></div>
              <div className="max-h-40 overflow-y-auto space-y-1 mt-2">
                {filteredPatients.map(p => (
                  <button key={p.id} onClick={() => setSelectedPatientId(p.id)}
                    className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors", selectedPatientId === p.id ? "bg-[#0A6EBD] text-white" : "hover:bg-muted")}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6"><AvatarFallback className="text-xs">{getInitials(p.user.name)}</AvatarFallback></Avatar>
                      {p.user.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5"><Label>Diagnosis</Label><Input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Primary diagnosis..." /></div>
            <div className="space-y-1.5"><Label>Notes (optional)</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} /></div>
            <Button disabled={!selectedPatientId || !diagnosis || saving} onClick={() => admitBed && updateBed(admitBed.id, "OCCUPIED", { patientId: selectedPatientId, diagnosis, notes })} className="w-full bg-[#0A6EBD] hover:bg-[#0957a0]">
              {saving ? "Admitting..." : "Admit Patient"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
