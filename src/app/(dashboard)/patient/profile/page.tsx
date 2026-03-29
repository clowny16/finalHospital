"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { profileUpdateSchema, changePasswordSchema, ProfileUpdateInput, ChangePasswordInput } from "@/lib/validators"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  User, Phone, MapPin, CalendarDays, Droplets, Shield,
  Lock, CheckCircle2, AlertTriangle, Edit3, Save, X
} from "lucide-react"
import { toast } from "sonner"
import { BLOOD_GROUP_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface Profile {
  id: string
  name: string
  email: string
  phone: string | null
  gender: string | null
  dateOfBirth: string | null
  address: string | null
  role: string
  patient: {
    id: string
    bloodGroup: string | null
    allergies: string | null
    emergencyContact: string | null
    insuranceNumber: string | null
    medicalHistory: string | null
  } | null
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value || <span className="text-muted-foreground italic">Not set</span>}</p>
      </div>
    </div>
  )
}

export default function PatientProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const profileForm = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
  })

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  })

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.data)
        if (d.data) {
          profileForm.reset({
            name: d.data.name,
            phone: d.data.phone ?? "",
            address: d.data.address ?? "",
            gender: d.data.gender ?? "",
            dateOfBirth: d.data.dateOfBirth
              ? new Date(d.data.dateOfBirth).toISOString().split("T")[0]
              : "",
          })
        }
        setLoading(false)
      })
  }, [profileForm])

  const onSaveProfile = async (data: ProfileUpdateInput) => {
    setSavingProfile(true)
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const resp = await res.json()
    setSavingProfile(false)
    if (!res.ok) { toast.error(resp.error || "Failed to update"); return }
    toast.success("Profile updated successfully!")
    setProfile((p) => p ? { ...p, ...resp.data } : p)
    setEditMode(false)
  }

  const onChangePassword = async (data: ChangePasswordInput) => {
    setSavingPassword(true)
    const res = await fetch("/api/profile/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const resp = await res.json()
    setSavingPassword(false)
    if (!res.ok) { toast.error(resp.error || "Failed to change password"); return }
    toast.success("Password changed successfully!")
    passwordForm.reset()
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const dob = profile.dateOfBirth ? new Date(profile.dateOfBirth) : null
  const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">View and manage your personal information</p>
        </div>
        {!editMode ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(true)}
            className="gap-2"
          >
            <Edit3 className="h-4 w-4" /> Edit Profile
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setEditMode(false); profileForm.reset() }}
            className="gap-2 text-muted-foreground"
          >
            <X className="h-4 w-4" /> Cancel
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Avatar & Summary */}
        <div className="space-y-4">
          <Card className="hosapp-card">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="h-24 w-24 mx-auto ring-4 ring-[#0A6EBD]/20">
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-[#0A6EBD] to-[#00B4A6] text-white">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#2DC653] rounded-full border-2 border-background flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <h2 className="text-lg font-semibold">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 text-[#0A6EBD] text-xs font-medium px-3 py-1 rounded-full">
                <Shield className="h-3 w-3" />
                Patient
              </div>
              {age !== null && (
                <p className="text-xs text-muted-foreground mt-2">{age} years old</p>
              )}
            </CardContent>
          </Card>

          {/* Medical Info Card */}
          <Card className="hosapp-card">
            <CardHeader className="pb-2">
              <CardTitle className="section-title flex items-center gap-2">
                <Droplets className="h-4 w-4 text-[#E63946]" /> Medical Info
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              <InfoRow
                icon={Droplets}
                label="Blood Group"
                value={profile.patient?.bloodGroup
                  ? (BLOOD_GROUP_LABELS[profile.patient.bloodGroup] || profile.patient.bloodGroup)
                  : null}
              />
              <InfoRow
                icon={AlertTriangle}
                label="Allergies"
                value={profile.patient?.allergies}
              />
              <InfoRow
                icon={Phone}
                label="Emergency Contact"
                value={profile.patient?.emergencyContact}
              />
              <InfoRow
                icon={Shield}
                label="Insurance No."
                value={profile.patient?.insuranceNumber}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right — Edit form / Info display + Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <Card className="hosapp-card">
            <CardHeader className="pb-3">
              <CardTitle className="section-title flex items-center gap-2">
                <User className="h-4 w-4 text-[#0A6EBD]" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!editMode ? (
                <div className="divide-y divide-border">
                  <InfoRow icon={User} label="Full Name" value={profile.name} />
                  <InfoRow icon={Phone} label="Phone" value={profile.phone} />
                  <InfoRow icon={User} label="Gender" value={profile.gender} />
                  <InfoRow
                    icon={CalendarDays}
                    label="Date of Birth"
                    value={dob ? dob.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null}
                  />
                  <InfoRow icon={MapPin} label="Address" value={profile.address} />
                </div>
              ) : (
                <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Full Name <span className="text-destructive">*</span></Label>
                      <Input {...profileForm.register("name")} placeholder="Your full name" />
                      {profileForm.formState.errors.name && (
                        <p className="text-xs text-destructive">{profileForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone Number</Label>
                      <Input {...profileForm.register("phone")} placeholder="+91 99999 00000" type="tel" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Gender</Label>
                      <Select
                        defaultValue={profile.gender ?? ""}
                        onValueChange={(v) => profileForm.setValue("gender", v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                          <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date of Birth</Label>
                      <Input {...profileForm.register("dateOfBirth")} type="date" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Address</Label>
                    <Input {...profileForm.register("address")} placeholder="Your home address" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={savingProfile}
                      className="bg-[#0A6EBD] hover:bg-[#0957a0] gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {savingProfile ? "Saving…" : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setEditMode(false); profileForm.reset() }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Account Info (read-only) */}
          <Card className="hosapp-card">
            <CardHeader className="pb-3">
              <CardTitle className="section-title flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#00B4A6]" /> Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              <InfoRow icon={User} label="Email Address" value={profile.email} />
              <InfoRow icon={Shield} label="Role" value={profile.role} />
              <div className="py-3">
                <p className="text-xs text-muted-foreground mb-1">Account Status</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2DC653] bg-green-50 dark:bg-green-950/30 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Active & Verified
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="hosapp-card">
            <CardHeader className="pb-3">
              <CardTitle className="section-title flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#F4A261]" /> Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Current Password</Label>
                  <Input
                    {...passwordForm.register("currentPassword")}
                    type="password"
                    placeholder="Enter current password"
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>New Password</Label>
                    <Input
                      {...passwordForm.register("newPassword")}
                      type="password"
                      placeholder="Min 8 chars, A-Z, 0-9, symbol"
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirm New Password</Label>
                    <Input
                      {...passwordForm.register("confirmNewPassword")}
                      type="password"
                      placeholder="Repeat new password"
                    />
                    {passwordForm.formState.errors.confirmNewPassword && (
                      <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmNewPassword.message}</p>
                    )}
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1">Password requirements</p>
                  <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5 list-disc list-inside">
                    <li>At least 8 characters</li>
                    <li>One uppercase letter (A–Z)</li>
                    <li>One number (0–9)</li>
                    <li>One special character (!@#$…)</li>
                  </ul>
                </div>
                <Button
                  type="submit"
                  disabled={savingPassword}
                  variant="outline"
                  className={cn("gap-2 border-[#F4A261] text-[#F4A261] hover:bg-amber-50 dark:hover:bg-amber-950/30")}
                >
                  <Lock className="h-4 w-4" />
                  {savingPassword ? "Updating…" : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
