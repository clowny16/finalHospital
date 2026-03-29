"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Droplets, Phone, AlertTriangle, CheckCircle2, Clock } from "lucide-react"
import { BLOOD_GROUP_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { bloodRequestSchema } from "@/lib/validators"
import { z } from "zod"

// Form schema — excludes bloodGroup (injected at submit time, not a form field)
const formSchema = z.object({
  patientName: z.string().min(2, "Name required"),
  units: z.number({ error: "Enter a valid number" }).min(1, "At least 1 unit required"),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  contactPhone: z.string().min(10, "Valid phone required"),
  hospital: z.string().optional(),
})
type FormValues = z.infer<typeof formSchema>

interface BloodBank {
  id: string
  bloodGroup: string
  unitsAvailable: number
  unitsReserved: number
  donorCount: number
}

type UrgencyLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

function levelColor(units: number) {
  if (units === 0) return { text: "text-[#E63946]", bg: "bg-red-50 dark:bg-red-950/20", badge: "Critical", icon: AlertTriangle }
  if (units < 5)  return { text: "text-[#E63946]", bg: "bg-red-50 dark:bg-red-950/20", badge: "Very Low", icon: AlertTriangle }
  if (units < 20) return { text: "text-[#F4A261]", bg: "bg-amber-50 dark:bg-amber-950/20", badge: "Low", icon: Clock }
  return { text: "text-[#2DC653]", bg: "bg-green-50 dark:bg-green-950/20", badge: "Good", icon: CheckCircle2 }
}

const URGENCY_OPTIONS: { value: UrgencyLevel; label: string; color: string }[] = [
  { value: "LOW",      label: "Low — Scheduled",       color: "text-blue-600" },
  { value: "MEDIUM",   label: "Medium — Within 24h",   color: "text-amber-600" },
  { value: "HIGH",     label: "High — Within 6h",      color: "text-orange-600" },
  { value: "CRITICAL", label: "Critical — Immediate",  color: "text-red-600" },
]

export default function PatientBloodBankPage() {
  const [data, setData] = useState<BloodBank[]>([])
  const [loading, setLoading] = useState(true)
  // selectedGroup = the blood group the user clicked "Request" for
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { urgency: "MEDIUM", units: 1 },
  })

  const urgency = watch("urgency")

  useEffect(() => {
    fetch("/api/blood-bank")
      .then((r) => r.json())
      .then((d) => { setData(d.data || []); setLoading(false) })
  }, [])

  // Open dialog for a specific blood group
  const openRequest = (bloodGroup: string) => {
    reset({ urgency: "MEDIUM", units: 1, patientName: "", contactPhone: "", hospital: "" })
    setSelectedGroup(bloodGroup)
  }

  // Close and reset
  const closeDialog = () => {
    setSelectedGroup(null)
    reset()
  }

  const onSubmit = async (formData: FormValues) => {
    if (!selectedGroup) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/blood-bank/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, bloodGroup: selectedGroup }),
      })
      const resp = await res.json()
      if (!res.ok) {
        toast.error(resp.error || "Request failed")
        return
      }
      toast.success("Blood request submitted! Our team will contact you shortly.")
      closeDialog()
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedLabel = selectedGroup
    ? (BLOOD_GROUP_LABELS[selectedGroup] || selectedGroup)
    : ""

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="page-title">Blood Bank</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Real-time blood group availability — request units directly
        </p>
      </div>

      {/* Emergency Banner */}
      <div className="flex items-center gap-3 bg-[#E63946]/10 border border-[#E63946]/30 rounded-xl p-4">
        <div className="w-9 h-9 rounded-lg bg-[#E63946]/20 flex items-center justify-center flex-shrink-0">
          <Phone className="h-4 w-4 text-[#E63946]" />
        </div>
        <div>
          <p className="font-semibold text-sm">Emergency? Call the blood bank directly</p>
          <p className="text-sm text-muted-foreground">+91-1800-HOSAPP (108) — available 24×7</p>
        </div>
      </div>

      {/* Blood Group Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.map((bb) => {
            const level = levelColor(bb.unitsAvailable)
            const LevelIcon = level.icon
            return (
              <Card key={bb.id} className="hosapp-card overflow-hidden">
                <CardContent className="p-0">
                  {/* Top colored strip */}
                  <div className={cn("px-4 pt-4 pb-3 text-center", level.bg)}>
                    <div className="w-12 h-12 rounded-full emergency-gradient mx-auto mb-2 flex items-center justify-center shadow-sm">
                      <Droplets className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold tracking-tight">{BLOOD_GROUP_LABELS[bb.bloodGroup] || bb.bloodGroup}</p>
                    <p className={cn("text-3xl font-bold mt-0.5", level.text)}>{bb.unitsAvailable}</p>
                    <p className="text-xs text-muted-foreground">units available</p>
                  </div>

                  {/* Bottom info */}
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{bb.donorCount} donors</p>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] gap-1 py-0", level.text)}
                      >
                        <LevelIcon className="h-2.5 w-2.5" />
                        {level.badge}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-[#E63946] hover:bg-[#c1121f] text-white text-xs font-medium"
                      onClick={() => openRequest(bb.bloodGroup)}
                      disabled={bb.unitsAvailable === 0}
                    >
                      {bb.unitsAvailable === 0 ? "Unavailable" : "Request Units"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Single shared Dialog — rendered ONCE, outside the map ── */}
      <Dialog open={selectedGroup !== null} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg emergency-gradient flex items-center justify-center">
                <Droplets className="h-4 w-4 text-white" />
              </div>
              Request <span className="text-[#E63946]">{selectedLabel}</span> Blood
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
            {/* Patient Name */}
            <div className="space-y-1.5">
              <Label htmlFor="patientName">
                Patient Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="patientName"
                {...register("patientName")}
                placeholder="Full name of the patient"
                autoFocus
              />
              {errors.patientName && (
                <p className="text-xs text-destructive">{errors.patientName.message}</p>
              )}
            </div>

            {/* Units + Urgency */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="units">
                  Units Required <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="units"
                  type="number"
                  min="1"
                  max="20"
                  {...register("units", { valueAsNumber: true })}
                />
                {errors.units && (
                  <p className="text-xs text-destructive">{errors.units.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Urgency Level <span className="text-destructive">*</span></Label>
                <Select
                  value={urgency}
                  onValueChange={(v) => setValue("urgency", v as UrgencyLevel, { shouldValidate: true })}
                >
                  <SelectTrigger id="urgency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className={opt.color}>{opt.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contact Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="contactPhone">
                Contact Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contactPhone"
                type="tel"
                {...register("contactPhone")}
                placeholder="+91 99999 00000"
              />
              {errors.contactPhone && (
                <p className="text-xs text-destructive">{errors.contactPhone.message}</p>
              )}
            </div>

            {/* Hospital (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="hospital">
                Hospital / Location <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="hospital"
                {...register("hospital")}
                placeholder="e.g. City General Hospital, Mumbai"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#E63946] hover:bg-[#c1121f] text-white font-medium gap-2"
              >
                <Droplets className="h-4 w-4" />
                {submitting ? "Submitting…" : "Submit Request"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
