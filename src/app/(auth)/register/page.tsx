"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Eye, EyeOff, User, Stethoscope, Shield, Check, ArrowRight, ArrowLeft, ActivitySquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { SPECIALIZATIONS, BLOOD_GROUPS, BLOOD_GROUP_LABELS } from "@/lib/constants"
import Link from "next/link"
import { toast } from "sonner"
import { registerStep1Schema, RegisterStep1Input } from "@/lib/validators"

type Step = 1 | 2 | 3

interface FormData {
  name: string; email: string; password: string; confirmPassword: string; phone: string; role: "PATIENT" | "DOCTOR" | "ADMIN"
  dateOfBirth?: string; gender?: string; bloodGroup?: string; address?: string
  specialization?: string; department?: string; licenseNumber?: string; qualification?: string; experience?: number; consultationFee?: number
  adminCode?: string
  terms?: boolean
}

const roles = [
  { value: "PATIENT", label: "Patient", desc: "Book appointments, view lab reports", icon: User },
  { value: "DOCTOR", label: "Doctor", desc: "Manage appointments and patients", icon: Stethoscope },
  { value: "ADMIN", label: "Administrator", desc: "Full hospital management access", icon: Shield },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<Partial<FormData>>({ role: "PATIENT" })

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<RegisterStep1Input>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: { role: "PATIENT" },
  })

  const selectedRole = watch("role") || formData.role || "PATIENT"

  const onStep1 = handleSubmit((data) => {
    setFormData(prev => ({ ...prev, ...data }))
    setStep(2)
  })

  const onStep2 = () => setStep(3)

  const onSubmit = async () => {
    setLoading(true)
    setError("")
    try {
      const payload = { ...formData }
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return }

      toast.success("Account created! Signing you in...")
      await signIn("credentials", { email: formData.email, password: formData.password, redirect: false })
      router.push("/")
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[580px]">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg medical-gradient flex items-center justify-center">
            <ActivitySquare className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold" style={{ fontFamily: "var(--font-fraunces)" }}>HOSAPP</span>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className={cn("flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all",
                  step > s ? "bg-[#0A6EBD] text-white" : step === s ? "bg-[#0A6EBD] text-white ring-4 ring-blue-100 dark:ring-blue-900" : "bg-muted text-muted-foreground")}>
                  {step > s ? <Check className="h-3.5 w-3.5" /> : s}
                </div>
              ))}
              <Progress value={(step / 3) * 100} className="flex-1 h-1.5" />
            </div>
            <CardTitle style={{ fontFamily: "var(--font-fraunces)" }}>
              {step === 1 ? "Create your account" : step === 2 ? "Personal details" : "Review & confirm"}
            </CardTitle>
            <CardDescription>Step {step} of 3</CardDescription>
          </CardHeader>

          <CardContent>
            {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

            {/* Step 1 */}
            {step === 1 && (
              <form onSubmit={onStep1} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input placeholder="Dr. Priya Sharma" {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input type="email" placeholder="you@example.com" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input type={showPass ? "text" : "password"} placeholder="••••••••" className="pr-9" {...register("password")} />
                      <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirm Password</Label>
                    <Input type="password" placeholder="••••••••" {...register("confirmPassword")} />
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input type="tel" placeholder="+91 99999 00000" {...register("phone")} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>I am a</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {roles.map(({ value, label, desc, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setValue("role", value as "PATIENT" | "DOCTOR" | "ADMIN")}
                        className={cn("p-3 rounded-xl border-2 text-left transition-all",
                          selectedRole === value ? "border-[#0A6EBD] bg-blue-50 dark:bg-blue-950/30" : "border-border hover:border-[#0A6EBD]/50")}
                      >
                        <Icon className={cn("h-5 w-5 mb-1.5", selectedRole === value ? "text-[#0A6EBD]" : "text-muted-foreground")} />
                        <p className="text-xs font-semibold">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full bg-[#0A6EBD] hover:bg-[#0957a0]">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-4">
                {selectedRole === "PATIENT" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Date of Birth</Label>
                        <Input type="date" onChange={(e) => setFormData(p => ({ ...p, dateOfBirth: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Gender</Label>
                        <Select onValueChange={(v) => setFormData(p => ({ ...p, gender: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Blood Group</Label>
                      <Select onValueChange={(v) => setFormData(p => ({ ...p, bloodGroup: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                        <SelectContent>
                          {BLOOD_GROUPS.map(bg => <SelectItem key={bg} value={bg}>{BLOOD_GROUP_LABELS[bg]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Address</Label>
                      <Input placeholder="123 Main St, Mumbai" onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} />
                    </div>
                  </>
                )}
                {selectedRole === "DOCTOR" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Specialization</Label>
                        <Select onValueChange={(v) => setFormData(p => ({ ...p, specialization: v, department: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{SPECIALIZATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>License Number</Label>
                        <Input placeholder="MCI-12345" onChange={(e) => setFormData(p => ({ ...p, licenseNumber: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Qualification</Label>
                      <Input placeholder="MBBS, MD Cardiology" onChange={(e) => setFormData(p => ({ ...p, qualification: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Experience (years)</Label>
                        <Input type="number" min="0" placeholder="10" onChange={(e) => setFormData(p => ({ ...p, experience: Number(e.target.value) }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Consultation Fee (₹)</Label>
                        <Input type="number" min="0" placeholder="500" onChange={(e) => setFormData(p => ({ ...p, consultationFee: Number(e.target.value) }))} />
                      </div>
                    </div>
                  </>
                )}
                {selectedRole === "ADMIN" && (
                  <div className="space-y-1.5">
                    <Label>Admin Access Code</Label>
                    <Input placeholder="HOSAPP-ADMIN-2025" type="password" onChange={(e) => setFormData(p => ({ ...p, adminCode: e.target.value }))} />
                    <p className="text-xs text-muted-foreground">Contact your hospital IT department for the admin code.</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                  <Button onClick={onStep2} className="flex-1 bg-[#0A6EBD] hover:bg-[#0957a0]">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{formData.name || getValues("name")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{formData.email || getValues("email")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-medium capitalize">{(formData.role || selectedRole).toLowerCase()}</span></div>
                  {formData.role === "PATIENT" && formData.bloodGroup && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Blood Group</span><span className="font-medium">{BLOOD_GROUP_LABELS[formData.bloodGroup] || formData.bloodGroup}</span></div>
                  )}
                  {formData.role === "DOCTOR" && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Specialization</span><span className="font-medium">{formData.specialization}</span></div>
                  )}
                </div>
                <div className="flex items-start gap-2.5">
                  <Checkbox id="terms" onCheckedChange={(v) => setFormData(p => ({ ...p, terms: !!v }))} />
                  <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    I agree to HOSAPP&apos;s <Link href="#" className="text-primary underline">Terms of Service</Link> and <Link href="#" className="text-primary underline">Privacy Policy</Link>
                  </Label>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                  <Button onClick={onSubmit} disabled={loading || !formData.terms} className="flex-1 bg-[#0A6EBD] hover:bg-[#0957a0]">
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account? <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
