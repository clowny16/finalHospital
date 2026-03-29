"use client"

import { useEffect, useState, useCallback } from "react"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Calendar, User, Phone, Clock, Video,
  CheckCircle2, XCircle, RefreshCw,
  PlayCircle, ChevronDown, Search, Filter,
} from "lucide-react"
import { formatDate, formatTime, getInitials } from "@/lib/utils"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Appointment {
  id: string
  date: string
  timeSlot: string
  status: string
  type: string
  reason?: string | null
  notes?: string | null
  patient: {
    user: { name: string; phone?: string | null; email?: string | null }
  }
}

type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED"

// Status transitions a doctor is allowed to make
const DOCTOR_STATUS_OPTIONS: {
  value: AppointmentStatus
  label: string
  icon: React.ElementType
  color: string
}[] = [
  { value: "CONFIRMED",    label: "Confirm",    icon: CheckCircle2, color: "text-blue-600" },
  { value: "COMPLETED",    label: "Complete",   icon: CheckCircle2, color: "text-green-600" },
  { value: "CANCELLED",    label: "Cancel",     icon: XCircle,      color: "text-red-600" },
  { value: "RESCHEDULED",  label: "Reschedule", icon: RefreshCw,    color: "text-purple-600" },
]

const STATUS_COLORS: Record<string, { bg: string; dot: string }> = {
  PENDING:     { bg: "bg-amber-50  dark:bg-amber-950/20",  dot: "bg-amber-500" },
  CONFIRMED:   { bg: "bg-blue-50   dark:bg-blue-950/20",   dot: "bg-blue-500" },
  COMPLETED:   { bg: "bg-green-50  dark:bg-green-950/20",  dot: "bg-green-500" },
  CANCELLED:   { bg: "bg-red-50    dark:bg-red-950/20",    dot: "bg-red-500" },
  RESCHEDULED: { bg: "bg-purple-50 dark:bg-purple-950/20", dot: "bg-purple-500" },
}

const FILTER_TABS: { label: string; value: string }[] = [
  { label: "All",         value: "ALL" },
  { label: "Pending",     value: "PENDING" },
  { label: "Confirmed",   value: "CONFIRMED" },
  { label: "Completed",   value: "COMPLETED" },
  { label: "Cancelled",   value: "CANCELLED" },
]

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [search, setSearch] = useState("")

  // Update dialog state
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [newStatus, setNewStatus] = useState<AppointmentStatus>("CONFIRMED")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchAppointments = useCallback(() => {
    setLoading(true)
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((d) => { setAppointments(d.data || []); setLoading(false) })
  }, [])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const openEdit = (appt: Appointment) => {
    setEditing(appt)
    setNewStatus(appt.status as AppointmentStatus)
    setNotes(appt.notes || "")
  }

  const closeEdit = () => {
    setEditing(null)
    setNotes("")
  }

  const handleUpdate = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch(`/api/appointments/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes: notes || undefined }),
      })
      const resp = await res.json()
      if (!res.ok) { toast.error(resp.error || "Failed to update"); return }

      toast.success(`Appointment marked as ${newStatus.toLowerCase()}`)
      // Optimistically update the list
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === editing.id ? { ...a, status: newStatus, notes } : a
        )
      )
      closeEdit()
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // Quick single-click status change (no notes needed)
  const quickUpdate = async (apptId: string, status: AppointmentStatus) => {
    const res = await fetch(`/api/appointments/${apptId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    const resp = await res.json()
    if (!res.ok) { toast.error(resp.error || "Failed"); return }
    toast.success(`Marked as ${status.toLowerCase()}`)
    setAppointments((prev) =>
      prev.map((a) => (a.id === apptId ? { ...a, status } : a))
    )
  }

  // Filter + search
  const filtered = appointments.filter((a) => {
    const matchStatus = filterStatus === "ALL" || a.status === filterStatus
    const q = search.toLowerCase()
    const matchSearch = !q ||
      a.patient.user.name.toLowerCase().includes(q) ||
      (a.reason || "").toLowerCase().includes(q) ||
      formatDate(a.date).toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const counts = FILTER_TABS.reduce<Record<string, number>>((acc, t) => {
    acc[t.value] = t.value === "ALL"
      ? appointments.length
      : appointments.filter((a) => a.status === t.value).length
    return acc
  }, {})

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">My Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {appointments.length} total · {counts["PENDING"] || 0} pending · {counts["CONFIRMED"] || 0} confirmed
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAppointments} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Search + Filter tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patient name, reason, date…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                filterStatus === tab.value
                  ? "bg-[#0A6EBD] text-white border-[#0A6EBD] shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-[#0A6EBD] hover:text-[#0A6EBD]"
              )}
            >
              {tab.label}
              {counts[tab.value] > 0 && (
                <span className={cn(
                  "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]",
                  filterStatus === tab.value ? "bg-white/20" : "bg-muted"
                )}>
                  {counts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No appointments found</p>
          <p className="text-sm">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt, i) => {
            const sc = STATUS_COLORS[appt.status] || STATUS_COLORS.PENDING
            const isPast = new Date(appt.date) < new Date()
            const isActionable = !["CANCELLED", "COMPLETED"].includes(appt.status)

            return (
              <div
                key={appt.id}
                className={cn(
                  "hosapp-card p-4 transition-all",
                  i % 2 === 1 && "bg-[#F8FAFC] dark:bg-muted/10"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Patient info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-11 w-11 flex-shrink-0">
                      <AvatarFallback className="text-sm font-semibold bg-blue-100 dark:bg-blue-950 text-[#0A6EBD]">
                        {getInitials(appt.patient.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{appt.patient.user.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {appt.patient.user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {appt.patient.user.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          {appt.type === "TELEMEDICINE"
                            ? <Video className="h-3 w-3 text-teal-500" />
                            : <User className="h-3 w-3" />
                          }
                          {appt.type === "TELEMEDICINE" ? "Telemedicine" : "In-Person"}
                        </span>
                      </div>
                      {appt.reason && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          Reason: {appt.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Date / Time */}
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-0.5 flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(appt.date)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTime(appt.timeSlot)}
                    </div>
                    {isPast && !["COMPLETED", "CANCELLED"].includes(appt.status) && (
                      <span className="text-[10px] text-amber-600 font-medium">Past due</span>
                    )}
                  </div>

                  {/* Status + Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={appt.status} />

                    {isActionable ? (
                      <>
                        {/* Quick confirm button for PENDING */}
                        {appt.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                            onClick={() => quickUpdate(appt.id, "CONFIRMED")}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Confirm
                          </Button>
                        )}
                        {/* Full update dialog */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => openEdit(appt)}
                        >
                          <PlayCircle className="h-3 w-3" /> Update
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1 text-muted-foreground"
                        onClick={() => openEdit(appt)}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>

                {/* Notes preview */}
                {appt.notes && (
                  <div className="mt-2 pl-14 text-xs text-muted-foreground italic border-l-2 border-muted ml-0.5">
                    {appt.notes}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Update Status Dialog ── */}
      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) closeEdit() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0A6EBD]/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-[#0A6EBD]" />
              </div>
              Update Appointment
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4 mt-1">
              {/* Patient summary */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p className="font-semibold">{editing.patient.user.name}</p>
                <p className="text-muted-foreground text-xs">
                  {formatDate(editing.date)} at {formatTime(editing.timeSlot)}
                </p>
                {editing.reason && (
                  <p className="text-muted-foreground text-xs">Reason: {editing.reason}</p>
                )}
              </div>

              {/* Current → New status */}
              <div className="space-y-1.5">
                <Label>Update Status</Label>
                <Select
                  value={newStatus}
                  onValueChange={(v) => setNewStatus(v as AppointmentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCTOR_STATUS_OPTIONS.map((opt) => {
                      const Icon = opt.icon
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className={cn("flex items-center gap-2", opt.color)}>
                            <Icon className="h-3.5 w-3.5" />
                            {opt.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Doctor notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes">
                  Notes / Remarks{" "}
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add clinical notes, instructions, or reason for status change…"
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>

              {/* Status change preview */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <StatusBadge status={editing.status} />
                <span>→</span>
                <StatusBadge status={newStatus} />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={closeEdit} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={saving || newStatus === editing?.status}
              className="bg-[#0A6EBD] hover:bg-[#0957a0] gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
