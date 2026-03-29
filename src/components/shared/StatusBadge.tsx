import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusMap: Record<string, { dot: string; label: string; bg: string; text: string }> = {
  // Appointment
  PENDING:     { dot: "bg-amber-500",  label: "Pending",    bg: "bg-amber-50 dark:bg-amber-950/30",  text: "text-amber-700 dark:text-amber-400" },
  CONFIRMED:   { dot: "bg-blue-500",   label: "Confirmed",  bg: "bg-blue-50 dark:bg-blue-950/30",    text: "text-blue-700 dark:text-blue-400" },
  CANCELLED:   { dot: "bg-red-500",    label: "Cancelled",  bg: "bg-red-50 dark:bg-red-950/30",      text: "text-red-700 dark:text-red-400" },
  COMPLETED:   { dot: "bg-gray-400",   label: "Completed",  bg: "bg-gray-100 dark:bg-gray-800",      text: "text-gray-600 dark:text-gray-400" },
  RESCHEDULED: { dot: "bg-purple-500", label: "Rescheduled",bg: "bg-purple-50 dark:bg-purple-950/30",text: "text-purple-700 dark:text-purple-400" },
  // Bed
  AVAILABLE:   { dot: "bg-green-500",  label: "Available",  bg: "bg-green-50 dark:bg-green-950/30",  text: "text-green-700 dark:text-green-400" },
  OCCUPIED:    { dot: "bg-red-500",    label: "Occupied",   bg: "bg-red-50 dark:bg-red-950/30",      text: "text-red-700 dark:text-red-400" },
  MAINTENANCE: { dot: "bg-amber-500",  label: "Maintenance",bg: "bg-amber-50 dark:bg-amber-950/30",  text: "text-amber-700 dark:text-amber-400" },
  // Lab
  IN_PROGRESS: { dot: "bg-blue-500",   label: "In Progress",bg: "bg-blue-50 dark:bg-blue-950/30",    text: "text-blue-700 dark:text-blue-400" },
  DELIVERED:   { dot: "bg-gray-400",   label: "Delivered",  bg: "bg-gray-100 dark:bg-gray-800",      text: "text-gray-600 dark:text-gray-400" },
  // Donation
  REGISTERED:  { dot: "bg-blue-500",   label: "Registered", bg: "bg-blue-50 dark:bg-blue-950/30",    text: "text-blue-700 dark:text-blue-400" },
  UNDER_REVIEW:{ dot: "bg-amber-500",  label: "Under Review",bg:"bg-amber-50 dark:bg-amber-950/30",  text: "text-amber-700 dark:text-amber-400" },
  APPROVED:    { dot: "bg-green-500",  label: "Approved",   bg: "bg-green-50 dark:bg-green-950/30",  text: "text-green-700 dark:text-green-400" },
  // Blood urgency
  CRITICAL:    { dot: "bg-red-600",    label: "Critical",   bg: "bg-red-100 dark:bg-red-950/50",     text: "text-red-700 dark:text-red-400" },
  HIGH:        { dot: "bg-orange-500", label: "High",       bg: "bg-orange-50 dark:bg-orange-950/30",text: "text-orange-700 dark:text-orange-400" },
  MEDIUM:      { dot: "bg-amber-500",  label: "Medium",     bg: "bg-amber-50 dark:bg-amber-950/30",  text: "text-amber-700 dark:text-amber-400" },
  LOW:         { dot: "bg-blue-400",   label: "Low",        bg: "bg-blue-50 dark:bg-blue-950/30",    text: "text-blue-700 dark:text-blue-400" },
  FULFILLED:   { dot: "bg-green-500",  label: "Fulfilled",  bg: "bg-green-50 dark:bg-green-950/30",  text: "text-green-700 dark:text-green-400" },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = statusMap[status] || { dot: "bg-gray-400", label: status, bg: "bg-gray-100", text: "text-gray-600" }
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium", cfg.bg, cfg.text, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  )
}
