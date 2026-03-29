import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  accent?: "blue" | "teal" | "red" | "green" | "amber"
  loading?: boolean
}

const accentMap = {
  blue: { bg: "bg-blue-50 dark:bg-blue-950/30", icon: "text-[#0A6EBD]", border: "border-blue-100 dark:border-blue-900" },
  teal: { bg: "bg-teal-50 dark:bg-teal-950/30", icon: "text-[#00B4A6]", border: "border-teal-100 dark:border-teal-900" },
  red: { bg: "bg-red-50 dark:bg-red-950/30", icon: "text-[#E63946]", border: "border-red-100 dark:border-red-900" },
  green: { bg: "bg-green-50 dark:bg-green-950/30", icon: "text-[#2DC653]", border: "border-green-100 dark:border-green-900" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/30", icon: "text-[#F4A261]", border: "border-amber-100 dark:border-amber-900" },
}

export function StatCard({ title, value, subtitle, icon: Icon, accent = "blue", loading }: StatCardProps) {
  const colors = accentMap[accent]

  if (loading) {
    return (
      <div className="hosapp-stat-card">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-24 bg-muted animate-pulse rounded" />
            <div className="h-7 w-16 bg-muted animate-pulse rounded" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="hosapp-stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={cn("p-2.5 rounded-xl", colors.bg)}>
          <Icon className={cn("h-5 w-5", colors.icon)} />
        </div>
      </div>
    </div>
  )
}
