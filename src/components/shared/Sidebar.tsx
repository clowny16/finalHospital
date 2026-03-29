"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, Calendar, FlaskConical, Droplets, Heart, User,
  Users, Stethoscope, BedDouble, BarChart3, Settings, LogOut,
  ActivitySquare, ClipboardList, Clock, ChevronLeft, ChevronRight,
} from "lucide-react"
import { cn, getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useState } from "react"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const patientNav: NavItem[] = [
  { label: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
  { label: "Appointments", href: "/patient/appointments", icon: Calendar },
  { label: "Lab Reports", href: "/patient/lab-reports", icon: FlaskConical },
  { label: "Blood Bank", href: "/patient/blood-bank", icon: Droplets },
  { label: "Organ Donation", href: "/patient/organ-donation", icon: Heart },
  { label: "Profile", href: "/patient/profile", icon: User },
]

const doctorNav: NavItem[] = [
  { label: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
  { label: "My Appointments", href: "/doctor/appointments", icon: Calendar },
  { label: "My Patients", href: "/doctor/patients", icon: Users },
  { label: "My Schedule", href: "/doctor/schedule", icon: Clock },
  { label: "Lab Reports", href: "/doctor/lab-reports", icon: FlaskConical },
  { label: "Profile", href: "/doctor/profile", icon: User },
]

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Bed Management", href: "/admin/beds", icon: BedDouble },
  { label: "Blood Bank", href: "/admin/blood-bank", icon: Droplets },
  { label: "Doctors", href: "/admin/doctors", icon: Stethoscope },
  { label: "Patients", href: "/admin/patients", icon: Users },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
]

interface SidebarProps {
  role: string
  userName: string
  userEmail: string
}

function NavLinks({ items, collapsed, pathname }: { items: NavItem[]; collapsed: boolean; pathname: string }) {
  return (
    <nav className="flex flex-col gap-1 px-2">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        const link = (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              isActive ? "sidebar-link-active" : "sidebar-link",
              collapsed && "justify-center px-2"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        )
        if (collapsed) {
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          )
        }
        return link
      })}
    </nav>
  )
}

function SidebarContent({ role, userName, userEmail, collapsed, onToggle }: SidebarProps & { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  const nav = role === "ADMIN" ? adminNav : role === "DOCTOR" ? doctorNav : patientNav

  return (
    <div className="flex h-full flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className={cn("flex items-center gap-2 px-4 py-5 border-b border-border", collapsed && "justify-center px-2")}>
        <div className="w-8 h-8 rounded-lg medical-gradient flex items-center justify-center flex-shrink-0">
          <ActivitySquare className="h-5 w-5 text-white animate-heartbeat" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight text-foreground" style={{ fontFamily: "var(--font-fraunces)" }}>
            HOSAPP
          </span>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4">
        <NavLinks items={nav} collapsed={collapsed} pathname={pathname} />
      </div>

      {/* User + Logout */}
      <div className={cn("border-t border-border p-3 space-y-2")}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <Badge variant="outline" className="text-xs capitalize mt-0.5">{role.toLowerCase()}</Badge>
            </div>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn("w-full text-destructive hover:text-destructive hover:bg-destructive/10", collapsed && "px-0")}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Logout</span>}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out of HOSAPP?</AlertDialogTitle>
              <AlertDialogDescription>You will be redirected to the login page.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => signOut({ callbackUrl: "/login" })} className="bg-destructive hover:bg-destructive/90">
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-muted z-10"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </div>
  )
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Desktop */}
      <div
        className={cn(
          "hidden md:block relative flex-shrink-0 transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className="fixed top-0 bottom-0 z-20" style={{ width: collapsed ? 64 : 240 }}>
          <SidebarContent role={role} userName={userName} userEmail={userEmail} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
        </div>
      </div>

      {/* Mobile Sheet trigger stored in Topbar via context — handled in layout */}
    </>
  )
}

export function MobileSidebar({ role, userName, userEmail }: SidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <ClipboardList className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-60">
        <div className="h-full">
          <SidebarContent role={role} userName={userName} userEmail={userEmail} collapsed={false} onToggle={() => {}} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
