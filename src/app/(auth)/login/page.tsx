"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, ActivitySquare, Shield, Bell, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { loginSchema, LoginInput } from "@/lib/validators"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [role, setRole] = useState("PATIENT")

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    setError("")
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (result?.error) {
        setError("Invalid email or password. Please try again.")
      } else {
        toast.success("Welcome back!")
        router.push("/")
        router.refresh()
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (r: string) => {
    const demos: Record<string, { email: string; password: string }> = {
      PATIENT: { email: "patient1@hosapp.com", password: "Test@1234" },
      DOCTOR:  { email: "dr.sharma@hosapp.com", password: "Test@1234" },
      ADMIN:   { email: "admin@hosapp.com",     password: "Test@1234" },
    }
    setValue("email", demos[r].email)
    setValue("password", demos[r].password)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[45%] medical-gradient flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <ActivitySquare className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-fraunces)" }}>
            HOSAPP
          </span>
        </div>

        <div>
          <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ fontFamily: "var(--font-fraunces)" }}>
            Your health,<br />managed smarter.
          </h1>
          <p className="text-white/80 text-lg mb-10">
            A medical-grade platform for patients, doctors, and hospital administrators.
          </p>
          <div className="space-y-5">
            {[
              { icon: Mic, title: "Voice Enabled", desc: "Navigate with your voice — hands-free healthcare." },
              { icon: Bell, title: "Real-Time Updates", desc: "Instant notifications for appointments and reports." },
              { icon: Shield, title: "Secure & Private", desc: "End-to-end encrypted. HIPAA-aligned data handling." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-white/70 text-sm mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/50 text-sm">© 2025 HOSAPP Medical Systems. All rights reserved.</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg medical-gradient flex items-center justify-center">
              <ActivitySquare className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-fraunces)" }}>HOSAPP</span>
          </div>

          <Card className="border-border shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl" style={{ fontFamily: "var(--font-fraunces)" }}>Welcome back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Role tabs */}
              <Tabs value={role} onValueChange={(v) => { setRole(v); fillDemo(v) }}>
                <TabsList className="w-full">
                  <TabsTrigger value="PATIENT" className="flex-1">Patient</TabsTrigger>
                  <TabsTrigger value="DOCTOR" className="flex-1">Doctor</TabsTrigger>
                  <TabsTrigger value="ADMIN" className="flex-1">Admin</TabsTrigger>
                </TabsList>
              </Tabs>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" className="pl-9" {...register("email")} />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9 pr-10"
                      {...register("password")}
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <Button type="submit" className="w-full bg-[#0A6EBD] hover:bg-[#0957a0]" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary font-medium hover:underline">Register</Link>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground text-center font-medium mb-1">Demo Credentials</p>
                <p className="text-xs text-muted-foreground text-center">Auto-filled for selected role. Password: <code className="bg-muted px-1 rounded">Test@1234</code></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
