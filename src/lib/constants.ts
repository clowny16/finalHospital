export const BLOOD_GROUPS = ["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"] as const

export const BLOOD_GROUP_LABELS: Record<string, string> = {
  A_POS: "A+",
  A_NEG: "A-",
  B_POS: "B+",
  B_NEG: "B-",
  AB_POS: "AB+",
  AB_NEG: "AB-",
  O_POS: "O+",
  O_NEG: "O-",
}

export const SPECIALIZATIONS = [
  "General Medicine",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Dermatology",
  "Gynecology",
  "Oncology",
  "ENT",
  "Ophthalmology",
]

export const DEPARTMENTS = [
  "General Medicine",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Dermatology",
  "Gynecology",
  "Oncology",
  "ENT",
  "Ophthalmology",
]

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

export const BED_TYPES = ["ICU", "GENERAL", "EMERGENCY", "PRIVATE"] as const

export const TEST_CATEGORIES = [
  "Blood Test",
  "Urine Test",
  "X-Ray",
  "MRI",
  "CT Scan",
  "ECG",
  "Ultrasound",
  "Biopsy",
  "Culture Test",
  "Genetic Test",
]

export const ORGANS = [
  { id: "heart", label: "Heart", icon: "❤️" },
  { id: "liver", label: "Liver", icon: "🫁" },
  { id: "kidney", label: "Kidney", icon: "🫘" },
  { id: "lungs", label: "Lungs", icon: "🫁" },
  { id: "cornea", label: "Cornea", icon: "👁️" },
  { id: "pancreas", label: "Pancreas", icon: "🫀" },
  { id: "intestine", label: "Intestine", icon: "🫀" },
  { id: "skin", label: "Skin", icon: "🩹" },
]

export const APPOINTMENT_STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "amber" },
  CONFIRMED: { label: "Confirmed", color: "blue" },
  CANCELLED: { label: "Cancelled", color: "red" },
  COMPLETED: { label: "Completed", color: "gray" },
  RESCHEDULED: { label: "Rescheduled", color: "purple" },
}

export const BED_STATUS_CONFIG = {
  AVAILABLE: { label: "Available", color: "green" },
  OCCUPIED: { label: "Occupied", color: "red" },
  MAINTENANCE: { label: "Maintenance", color: "amber" },
}

export const LAB_STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "amber" },
  IN_PROGRESS: { label: "In Progress", color: "blue" },
  COMPLETED: { label: "Completed", color: "green" },
  DELIVERED: { label: "Delivered", color: "gray" },
}

export const DONATION_STATUS_CONFIG = {
  REGISTERED: { label: "Registered", color: "blue" },
  UNDER_REVIEW: { label: "Under Review", color: "amber" },
  APPROVED: { label: "Approved", color: "green" },
  COMPLETED: { label: "Completed", color: "gray" },
}

export const ROLE_DASHBOARDS: Record<string, string> = {
  PATIENT: "/patient/dashboard",
  DOCTOR: "/doctor/dashboard",
  ADMIN: "/admin/dashboard",
}
