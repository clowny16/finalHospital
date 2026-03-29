"use client"
import { useEffect, useState } from "react"
import { Droplets, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Skeleton } from "@/components/ui/skeleton"
import { BLOOD_GROUP_LABELS } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface BloodBank { id: string; bloodGroup: string; unitsAvailable: number; unitsReserved: number; donorCount: number }
interface BloodRequest { id: string; patientName: string; bloodGroup: string; units: number; urgency: string; status: string; contactPhone: string; requestedAt: string; hospital?: string | null }

function unitColor(u: number) { return u < 5 ? "text-[#E63946]" : u < 20 ? "text-[#F4A261]" : "text-[#2DC653]" }

export default function AdminBloodBankPage() {
  const [bb, setBb] = useState<BloodBank[]>([])
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [editUnits, setEditUnits] = useState<Record<string, string>>({})

  useEffect(() => {
    Promise.all([fetch("/api/blood-bank").then(r=>r.json()), fetch("/api/blood-bank/request").then(r=>r.json())])
      .then(([b, req]) => { setBb(b.data||[]); setRequests(req.data||[]); setLoading(false) })
  }, [])

  const fulfill = async (id: string) => {
    const res = await fetch(`/api/blood-bank/request/${id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ status: "FULFILLED" }) })
    if (res.ok) { toast.success("Request fulfilled"); setRequests(prev => prev.map(r => r.id===id ? {...r, status:"FULFILLED"} : r)) }
    else toast.error("Failed to update")
  }

  const pending = requests.filter(r => r.status === "PENDING")
  const criticalGroups = bb.filter(b => b.unitsAvailable < 5)

  return (
    <div className="space-y-6 pb-8">
      <div><h1 className="page-title">Blood Bank Management</h1><p className="text-muted-foreground text-sm mt-1">Monitor inventory and manage donation requests</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Units", value: bb.reduce((s,b)=>s+b.unitsAvailable,0), color: "text-[#0A6EBD]" },
          { label: "Critical Groups", value: criticalGroups.length, color: "text-[#E63946]" },
          { label: "Pending Requests", value: pending.length, color: "text-[#F4A261]" },
          { label: "Total Requests", value: requests.length, color: "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="hosapp-stat-card text-center">
            <p className={cn("text-3xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title">Blood Inventory</h2>
      {loading ? <div className="grid grid-cols-4 gap-4">{[1,2,3,4,5,6,7,8].map(i=><Skeleton key={i} className="h-32 rounded-xl"/>)}</div> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {bb.map(b => (
            <Card key={b.id} className={cn("hosapp-card", b.unitsAvailable < 5 && "border-red-300 dark:border-red-800")}>
              <CardContent className="p-4 text-center">
                {b.unitsAvailable < 5 && <div className="flex items-center justify-center gap-1 text-xs text-[#E63946] mb-1"><AlertCircle className="h-3 w-3"/>Critical Low</div>}
                <p className="text-xl font-bold">{BLOOD_GROUP_LABELS[b.bloodGroup] || b.bloodGroup}</p>
                <p className={cn("text-2xl font-bold mt-1", unitColor(b.unitsAvailable))}>{b.unitsAvailable}</p>
                <p className="text-xs text-muted-foreground">units</p>
                <div className="flex items-center gap-1.5 mt-3">
                  <Input type="number" min="0" className="h-7 text-xs text-center p-1" value={editUnits[b.bloodGroup]??b.unitsAvailable}
                    onChange={e => setEditUnits(p => ({...p, [b.bloodGroup]: e.target.value}))} />
                  <Button size="sm" className="h-7 text-xs px-2 bg-[#0A6EBD] hover:bg-[#0957a0]"
                    onClick={async () => {
                      await fetch(`/api/blood-bank/${b.bloodGroup}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ unitsAvailable: Number(editUnits[b.bloodGroup]) }) })
                      toast.success("Updated"); setBb(prev => prev.map(x => x.bloodGroup===b.bloodGroup ? {...x, unitsAvailable: Number(editUnits[b.bloodGroup])} : x))
                    }}>Save</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <h2 className="section-title mt-8">Blood Requests</h2>
      <div className="space-y-3">
        {requests.map((r, i) => (
          <div key={r.id} className={`hosapp-card p-4 flex items-center justify-between gap-4 ${i%2===1?"bg-[#F8FAFC] dark:bg-muted/20":""}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full emergency-gradient flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">{BLOOD_GROUP_LABELS[r.bloodGroup]||r.bloodGroup}</span>
              </div>
              <div>
                <p className="font-semibold text-sm">{r.patientName}</p>
                <p className="text-xs text-muted-foreground">{r.units} units • {r.contactPhone} {r.hospital ? `• ${r.hospital}` : ""}</p>
                <p className="text-xs text-muted-foreground">{formatDate(r.requestedAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={r.urgency} />
              <StatusBadge status={r.status} />
              {r.status === "PENDING" && (
                <Button size="sm" className="h-7 text-xs bg-[#2DC653] hover:bg-green-600 text-white" onClick={() => fulfill(r.id)}>Fulfill</Button>
              )}
            </div>
          </div>
        ))}
        {requests.length === 0 && <div className="text-center py-10 text-muted-foreground"><Droplets className="h-10 w-10 mx-auto mb-3 opacity-30"/><p>No blood requests</p></div>}
      </div>
    </div>
  )
}
