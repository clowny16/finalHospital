"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatDate, formatTime, formatCurrency, getInitials } from "@/lib/utils"
import { SPECIALIZATIONS, BLOOD_GROUP_LABELS } from "@/lib/constants"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { format, addDays, isBefore, startOfDay } from "date-fns"

interface Doctor { id: string; specialization: string; department: string; experience: number; consultationFee: number; isAvailable: boolean; workingDays: string; workingHoursStart: string; workingHoursEnd: string; user: { name: string } }
interface Appointment { id: string; date: string; timeSlot: string; status: string; type: string; reason?: string; doctor: { user: { name: string }; specialization: string; department: string }; patient: { user: { name: string } } }
interface TimeSlot { time: string; available: boolean }

export default function PatientAppointmentsPage() {
  const [tab, setTab] = useState("book")
  const [step, setStep] = useState(1)
  const [specialist, setSpecialist] = useState("")
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState("")
  const [reason, setReason] = useState("")
  const [apptType, setApptType] = useState("IN_PERSON")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingAppts, setLoadingAppts] = useState(true)
  const [booking, setBooking] = useState(false)
  const [searchName, setSearchName] = useState("")
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)

  useEffect(() => {
    if (tab === "my") {
      setLoadingAppts(true)
      fetch("/api/appointments").then(r => r.json()).then(d => { setAppointments(d.data || []); setLoadingAppts(false) })
    }
  }, [tab])

  useEffect(() => {
    setLoadingDoctors(true)
    const params = new URLSearchParams({ limit: "50" })
    if (specialist) params.set("specialization", specialist)
    if (searchName) params.set("name", searchName)
    fetch(`/api/doctors?${params}`).then(r => r.json()).then(d => { setDoctors(d.data || []); setLoadingDoctors(false) })
  }, [specialist, searchName])

  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return
    setLoadingSlots(true)
    setSlots([])
    fetch(`/api/doctors/${selectedDoctor.id}/slots?date=${format(selectedDate, "yyyy-MM-dd")}`)
      .then(r => r.json()).then(d => { setSlots(d.data || []); setLoadingSlots(false) })
  }, [selectedDoctor, selectedDate])

  const handleBook = async () => {
    if (!selectedDoctor || !selectedSlot) return
    setBooking(true)
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId: selectedDoctor.id, date: format(selectedDate, "yyyy-MM-dd"), timeSlot: selectedSlot, reason, type: apptType }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error || "Booking failed"); setBooking(false); return }
    toast.success("Appointment booked successfully!")
    setTab("my"); setStep(1); setSelectedDoctor(null); setSelectedSlot(""); setReason(""); setBooking(false)
    fetch("/api/appointments").then(r => r.json()).then(d => setAppointments(d.data || []))
  }

  const cancelAppt = async (id: string) => {
    const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Appointment cancelled"); setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "CANCELLED" } : a)) }
    else toast.error("Failed to cancel appointment")
  }

  const today = startOfDay(new Date())
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(addDays(today, currentWeekOffset * 7), i))

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="page-title">Appointments</h1>
        <p className="text-muted-foreground text-sm mt-1">Book a new appointment or manage your existing ones</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="book">Book Appointment</TabsTrigger>
          <TabsTrigger value="my">My Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="book" className="mt-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {["Department", "Doctor", "Date & Time", "Confirm"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 ${step > i + 1 ? "text-[#0A6EBD]" : step === i + 1 ? "text-foreground" : "text-muted-foreground"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step > i + 1 ? "bg-[#0A6EBD] text-white" : step === i + 1 ? "ring-2 ring-[#0A6EBD]" : "bg-muted"}`}>
                    {step > i + 1 ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  <span className="text-xs hidden sm:block font-medium">{s}</span>
                </div>
                {i < 3 && <div className="flex-1 h-px bg-border w-6 hidden sm:block" />}
              </div>
            ))}
          </div>

          {/* Step 1 - Department */}
          {step === 1 && (
            <div>
              <h2 className="section-title mb-4">Select Department</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {SPECIALIZATIONS.map(spec => (
                  <button key={spec} onClick={() => { setSpecialist(spec); setStep(2) }}
                    className="hosapp-card p-4 text-center cursor-pointer hover:border-[#0A6EBD] group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 mx-auto mb-2 flex items-center justify-center text-[#0A6EBD] group-hover:scale-110 transition-transform">
                      <User className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold leading-tight">{spec}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 - Doctor */}
          {step === 2 && (
            <div>
              <div className="flex gap-3 mb-4">
                <Button variant="outline" size="sm" onClick={() => setStep(1)}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
                <Input placeholder="Search doctor by name..." value={searchName} onChange={e => setSearchName(e.target.value)} className="max-w-xs" />
              </div>
              {loadingDoctors ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doctors.map(doc => (
                    <div key={doc.id} className="hosapp-card p-4 cursor-pointer hover:border-[#0A6EBD]" onClick={() => { setSelectedDoctor(doc); setStep(3) }}>
                      <div className="flex gap-3">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarFallback className="bg-[#0A6EBD] text-white text-sm font-bold">{getInitials(doc.user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">Dr. {doc.user.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.specialization}</p>
                          <p className="text-xs text-muted-foreground">{doc.experience} yrs exp</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <span className="text-sm font-bold text-[#0A6EBD]">{formatCurrency(doc.consultationFee)}</span>
                        {doc.isAvailable ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 text-xs border-0">Available</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Unavailable</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3 - Date & Time */}
          {step === 3 && selectedDoctor && (
            <div>
              <Button variant="outline" size="sm" onClick={() => setStep(2)} className="mb-4"><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
              <div className="flex gap-3 items-center mb-4 p-3 bg-muted/50 rounded-xl">
                <Avatar className="h-10 w-10"><AvatarFallback className="bg-[#0A6EBD] text-white text-sm font-bold">{getInitials(selectedDoctor.user.name)}</AvatarFallback></Avatar>
                <div><p className="font-semibold text-sm">Dr. {selectedDoctor.user.name}</p><p className="text-xs text-muted-foreground">{selectedDoctor.specialization} • {formatCurrency(selectedDoctor.consultationFee)}</p></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Date picker */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Select Date</h3>
                  <div className="flex items-center justify-between mb-2">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentWeekOffset(w => Math.max(0, w - 1))}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-sm font-medium">{format(weekDays[0], "MMM d")} — {format(weekDays[6], "MMM d, yyyy")}</span>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentWeekOffset(w => w + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map(day => {
                      const isPast = isBefore(startOfDay(day), today)
                      const isSelected = format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                      return (
                        <button key={day.toISOString()} disabled={isPast}
                          onClick={() => { setSelectedDate(day); setSelectedSlot("") }}
                          className={`flex flex-col items-center p-2 rounded-lg text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isSelected ? "bg-[#0A6EBD] text-white" : "hover:bg-muted"}`}>
                          <span className="opacity-70">{format(day, "EEE")}</span>
                          <span className="font-bold mt-0.5">{format(day, "d")}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                {/* Time slots */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Available Slots for {format(selectedDate, "dd MMM yyyy")}</h3>
                  {loadingSlots ? (
                    <div className="grid grid-cols-3 gap-2">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-9 rounded-lg" />)}</div>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No slots available for this day. Select a working day.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map(s => (
                        <button key={s.time} disabled={!s.available}
                          onClick={() => setSelectedSlot(s.time)}
                          className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${selectedSlot === s.time ? "bg-[#0A6EBD] text-white border-[#0A6EBD]" : s.available ? "border-border hover:border-[#0A6EBD]" : "border-border"}`}>
                          {formatTime(s.time)}
                          {!s.available && <span className="block text-[10px] opacity-60">Booked</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {selectedSlot && (
                <Button onClick={() => setStep(4)} className="mt-5 bg-[#0A6EBD] hover:bg-[#0957a0]">
                  Continue to Confirm <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Step 4 - Confirm */}
          {step === 4 && selectedDoctor && (
            <div>
              <Button variant="outline" size="sm" onClick={() => setStep(3)} className="mb-4"><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
              <Card className="max-w-md">
                <CardHeader><CardTitle className="section-title">Confirm Booking</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Doctor</span><span className="font-medium">Dr. {selectedDoctor.user.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Specialization</span><span>{selectedDoctor.specialization}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{formatDate(selectedDate)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{formatTime(selectedSlot)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span className="font-semibold text-[#0A6EBD]">{formatCurrency(selectedDoctor.consultationFee)}</span></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Appointment Type</Label>
                    <Select value={apptType} onValueChange={setApptType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN_PERSON">In-Person Visit</SelectItem>
                        <SelectItem value="TELEMEDICINE">Telemedicine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason (optional)</Label>
                    <Textarea placeholder="Describe your symptoms or reason for visit..." value={reason} onChange={e => setReason(e.target.value)} rows={3} />
                  </div>
                  <Button onClick={handleBook} disabled={booking} className="w-full bg-[#0A6EBD] hover:bg-[#0957a0]">
                    {booking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Booking...</> : "Confirm Booking"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my" className="mt-6">
          <h2 className="section-title mb-4">My Appointments</h2>
          {loadingAppts ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No appointments yet</p>
              <Button onClick={() => setTab("book")} size="sm" className="mt-3 bg-[#0A6EBD] hover:bg-[#0957a0]">Book Now</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map(appt => (
                <div key={appt.id} className="hosapp-card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10"><AvatarFallback className="bg-[#0A6EBD] text-white text-sm">{getInitials(appt.doctor.user.name)}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-semibold text-sm">Dr. {appt.doctor.user.name}</p>
                      <p className="text-xs text-muted-foreground">{appt.doctor.specialization} • {appt.type === "TELEMEDICINE" ? "Telemedicine" : "In-Person"}</p>
                    </div>
                  </div>
                  <div className="text-center hidden md:block">
                    <p className="text-sm font-medium">{formatDate(appt.date)}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(appt.timeSlot)}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                  {["PENDING", "CONFIRMED"].includes(appt.status) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs">Cancel</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Cancel Appointment?</AlertDialogTitle><AlertDialogDescription>This will cancel your appointment with Dr. {appt.doctor.user.name}.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Keep it</AlertDialogCancel><AlertDialogAction onClick={() => cancelAppt(appt.id)} className="bg-destructive hover:bg-destructive/90">Cancel Appointment</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
