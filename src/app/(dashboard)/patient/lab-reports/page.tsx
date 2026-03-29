"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { FlaskConical, Download, Eye } from "lucide-react"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatDate } from "@/lib/utils"

interface LabReport { id: string; testName: string; testCategory: string; status: string; orderedAt: string; completedAt?: string; result?: string; normalRange?: string; remarks?: string; reportUrl?: string; doctor?: { user: { name: string } } | null }

export default function PatientLabReportsPage() {
  const [reports, setReports] = useState<LabReport[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [selected, setSelected] = useState<LabReport | null>(null)

  useEffect(() => {
    fetch("/api/lab-reports").then(r => r.json()).then(d => { setReports(d.data || []); setLoading(false) })
  }, [])

  const filtered = activeTab === "all" ? reports : reports.filter(r => r.status === activeTab.toUpperCase().replace("-", "_"))

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="page-title">Lab Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">View and download your medical test results</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No {activeTab === "all" ? "" : activeTab} reports found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r, i) => (
                <div key={r.id} className={`hosapp-card p-4 flex items-center justify-between gap-4 ${i % 2 === 1 ? "bg-[#F8FAFC] dark:bg-muted/20" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                      <FlaskConical className="h-5 w-5 text-[#F4A261]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{r.testName}</p>
                      <p className="text-xs text-muted-foreground">{r.testCategory} • {r.doctor ? `Dr. ${r.doctor.user.name}` : "Self-referred"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Ordered: {formatDate(r.orderedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    {r.status === "COMPLETED" && (
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setSelected(r)}>
                        <Eye className="h-3.5 w-3.5" />View
                      </Button>
                    )}
                    {r.reportUrl && (
                      <a href={r.reportUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                          <Download className="h-3.5 w-3.5" />Download
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>{selected?.testName}</SheetTitle></SheetHeader>
          {selected && (
            <div className="mt-6 space-y-4 text-sm">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{selected.testCategory}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ordered</span><span>{formatDate(selected.orderedAt)}</span></div>
                {selected.completedAt && <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span>{formatDate(selected.completedAt)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={selected.status} /></div>
              </div>
              {selected.result && (
                <div className="space-y-2">
                  <p className="font-semibold">Result</p>
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl p-4">
                    <p className="font-bold text-green-800 dark:text-green-300">{selected.result}</p>
                    {selected.normalRange && <p className="text-xs text-green-700 dark:text-green-400 mt-1">Normal range: {selected.normalRange}</p>}
                  </div>
                </div>
              )}
              {selected.remarks && <div className="space-y-2"><p className="font-semibold">Doctor&apos;s Remarks</p><p className="text-muted-foreground bg-muted p-3 rounded-lg">{selected.remarks}</p></div>}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
