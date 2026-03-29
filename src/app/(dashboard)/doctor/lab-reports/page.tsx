"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { FlaskConical, Edit } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

interface LabReport { id: string; testName: string; testCategory: string; status: string; orderedAt: string; result?: string; normalRange?: string; remarks?: string; patient: { user: { name: string } } }

export default function DoctorLabReportsPage() {
  const [reports, setReports] = useState<LabReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<LabReport | null>(null)
  const [result, setResult] = useState("")
  const [normalRange, setNormalRange] = useState("")
  const [remarks, setRemarks] = useState("")
  const [status, setStatus] = useState("COMPLETED")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/lab-reports").then(r => r.json()).then(d => { setReports(d.data || []); setLoading(false) })
  }, [])

  const openSheet = (r: LabReport) => {
    setSelected(r); setResult(r.result || ""); setNormalRange(r.normalRange || ""); setRemarks(r.remarks || ""); setStatus("COMPLETED")
  }

  const save = async () => {
    if (!selected) return
    setSaving(true)
    const res = await fetch(`/api/lab-reports/${selected.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result, normalRange, remarks, status }),
    })
    if (res.ok) {
      toast.success("Lab report updated"); setReports(prev => prev.map(r => r.id === selected.id ? { ...r, result, normalRange, remarks, status } : r)); setSelected(null)
    } else toast.error("Failed to update")
    setSaving(false)
  }

  return (
    <div className="space-y-6 pb-8">
      <div><h1 className="page-title">Lab Reports</h1><p className="text-muted-foreground text-sm mt-1">Review and update patient lab results</p></div>
      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No lab reports found</p></div>
      ) : (
        <div className="space-y-3">
          {reports.map((r, i) => (
            <div key={r.id} className={`hosapp-card p-4 flex items-center justify-between gap-4 ${i % 2 === 1 ? "bg-[#F8FAFC] dark:bg-muted/20" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center"><FlaskConical className="h-4 w-4 text-[#F4A261]" /></div>
                <div>
                  <p className="font-semibold text-sm">{r.testName}</p>
                  <p className="text-xs text-muted-foreground">{r.patient.user.name} • {r.testCategory} • {formatDate(r.orderedAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={r.status} />
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => openSheet(r)}>
                  <Edit className="h-3 w-3" />Update
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>Update Lab Result</SheetTitle></SheetHeader>
          {selected && (
            <div className="mt-6 space-y-4">
              <div className="bg-muted/50 rounded-xl p-3 text-sm">
                <p className="font-semibold">{selected.testName}</p>
                <p className="text-muted-foreground text-xs mt-1">{selected.patient.user.name} • {selected.testCategory}</p>
              </div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Result</Label><Input value={result} onChange={e => setResult(e.target.value)} placeholder="e.g. 120 mg/dL" /></div>
              <div className="space-y-1.5"><Label>Normal Range</Label><Input value={normalRange} onChange={e => setNormalRange(e.target.value)} placeholder="e.g. 70–100 mg/dL" /></div>
              <div className="space-y-1.5"><Label>Remarks</Label><Textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} placeholder="Additional observations..." /></div>
              <Button onClick={save} disabled={saving} className="w-full bg-[#0A6EBD] hover:bg-[#0957a0]">{saving ? "Saving..." : "Save Results"}</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
