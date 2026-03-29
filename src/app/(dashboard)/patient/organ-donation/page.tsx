"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Heart, Users, Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

const ORGANS = [
  { id: "Heart", emoji: "❤️", desc: "Life sustaining pump" },
  { id: "Liver", emoji: "🟤", desc: "Vital for detoxification" },
  { id: "Kidney", emoji: "🫘", desc: "Filtration system (×2)" },
  { id: "Lungs", emoji: "🫁", desc: "Respiratory organs" },
  { id: "Cornea", emoji: "👁️", desc: "Restores vision" },
  { id: "Pancreas", emoji: "🟡", desc: "Regulates blood sugar" },
  { id: "Intestine", emoji: "🔴", desc: "Digestive system part" },
  { id: "Skin", emoji: "🩹", desc: "Burn treatment donor" },
]

interface Donation { id: string; organs: string; status: string; registeredAt: string }

export default function OrganDonationPage() {
  const [donation, setDonation] = useState<Donation | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOrgans, setSelectedOrgans] = useState<string[]>([])
  const [consent, setConsent] = useState(false)
  const [declaration, setDeclaration] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch("/api/organ-donation").then(r => r.json()).then(d => { setDonation(d.data || null); setLoading(false) })
  }, [])

  const toggle = (organ: string) => setSelectedOrgans(prev => prev.includes(organ) ? prev.filter(o => o !== organ) : [...prev, organ])

  const handleRegister = async () => {
    if (selectedOrgans.length === 0) { toast.error("Please select at least one organ"); return }
    if (!consent || !declaration) { toast.error("Please confirm all declarations"); return }
    setSubmitting(true)
    const res = await fetch("/api/organ-donation", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organs: selectedOrgans.join(","), notes: "" }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error || "Registration failed"); setSubmitting(false); return }
    setDonation(data.data)
    setSuccess(true)
    setSubmitting(false)
  }

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>

  return (
    <div className="space-y-8 pb-8">
      {/* Hero */}
      <div className="rounded-2xl teal-gradient p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-2">Organ Donation</p>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-fraunces)" }}>One Decision. Eight Lives Saved.</h1>
        <p className="text-white/80 text-lg mb-6">Registering as an organ donor is a gift that lasts forever.</p>
        <div className="grid grid-cols-3 gap-4">
          {[["500k+", "Lives saveable annually"], ["18", "Organs per donor"], ["10 sec", "To register"]].map(([n, l]) => (
            <div key={n} className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-xl font-bold">{n}</p><p className="text-xs opacity-80 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div>
        <h2 className="section-title mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Register Online", desc: "Fill in the registration form and select the organs you'd like to donate." },
            { step: "2", title: "Review Process", desc: "Our medical team reviews your registration and updates the status." },
            { step: "3", title: "Your Legacy Lives On", desc: "Your decision gives life to others when it matters most." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="hosapp-card p-5">
              <div className="w-9 h-9 rounded-full medical-gradient flex items-center justify-center text-white font-bold text-sm mb-3">{step}</div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Existing registration */}
      {donation && !success ? (
        <Card>
          <CardHeader><CardTitle className="section-title">Your Donation Registration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/20 rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center"><Check className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300">You are a registered organ donor</p>
                <p className="text-sm text-green-700 dark:text-green-400">Registered on {formatDate(donation.registeredAt)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Status</span><StatusBadge status={donation.status} /></div>
            <div><p className="text-sm font-medium mb-2">Registered Organs</p><div className="flex flex-wrap gap-2">{donation.organs.split(",").map(o => <span key={o} className="px-3 py-1 bg-muted rounded-full text-xs font-medium">{o}</span>)}</div></div>
          </CardContent>
        </Card>
      ) : success ? (
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4"><Sparkles className="h-8 w-8 text-green-600" /></div>
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2" style={{ fontFamily: "var(--font-fraunces)" }}>Thank You!</h2>
            <p className="text-muted-foreground mb-6">You&apos;re now a registered organ donor. Your decision may save up to 8 lives.</p>
            {donation && <p className="text-sm text-muted-foreground">Donation ID: <code className="bg-muted px-2 py-0.5 rounded text-xs">{donation.id}</code></p>}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Organ Selection */}
          <div>
            <h2 className="section-title mb-4">What You Can Donate</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ORGANS.map(({ id, emoji, desc }) => (
                <button key={id} onClick={() => toggle(id)}
                  className={cn("hosapp-card p-4 text-left transition-all cursor-pointer", selectedOrgans.includes(id) ? "border-[#00B4A6] bg-teal-50 dark:bg-teal-950/20" : "hover:border-[#00B4A6]/50")}>
                  <span className="text-2xl block mb-2">{emoji}</span>
                  <p className="font-semibold text-sm">{id}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  {selectedOrgans.includes(id) && <div className="mt-2 w-5 h-5 rounded-full bg-[#00B4A6] flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>}
                </button>
              ))}
            </div>
          </div>

          {/* Registration Form */}
          <Card className="max-w-lg">
            <CardHeader><CardTitle className="section-title">Become a Donor Today</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {selectedOrgans.length > 0 && (
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Selected organs:</p>
                  <div className="flex flex-wrap gap-2">{selectedOrgans.map(o => <span key={o} className="px-2 py-0.5 bg-[#00B4A6]/20 text-[#00B4A6] rounded-full text-xs font-medium">{o}</span>)}</div>
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <Checkbox id="decl" checked={declaration} onCheckedChange={v => setDeclaration(!!v)} />
                  <Label htmlFor="decl" className="text-sm cursor-pointer leading-relaxed">I declare I have no medical conditions that would prevent organ donation</Label>
                </div>
                <div className="flex items-start gap-2.5">
                  <Checkbox id="consent" checked={consent} onCheckedChange={v => setConsent(!!v)} />
                  <Label htmlFor="consent" className="text-sm cursor-pointer leading-relaxed">I give my informed consent to donate the selected organs at the time of death</Label>
                </div>
              </div>
              <Button onClick={handleRegister} disabled={submitting || selectedOrgans.length === 0 || !consent || !declaration}
                className="w-full bg-[#00B4A6] hover:bg-[#009d91] text-white">
                <Heart className="mr-2 h-4 w-4" />
                {submitting ? "Registering..." : "Register as Donor"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
