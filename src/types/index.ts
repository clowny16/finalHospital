export type Role = "PATIENT" | "DOCTOR" | "ADMIN"
export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "RESCHEDULED"
export type BedType = "ICU" | "GENERAL" | "EMERGENCY" | "PRIVATE"
export type BedStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE"
export type BloodGroup = "A_POS" | "A_NEG" | "B_POS" | "B_NEG" | "AB_POS" | "AB_NEG" | "O_POS" | "O_NEG"
export type LabReportStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DELIVERED"
export type DonationStatus = "REGISTERED" | "UNDER_REVIEW" | "APPROVED" | "COMPLETED"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  phone?: string | null
  dateOfBirth?: Date | null
  gender?: string | null
  address?: string | null
  profileImage?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Patient {
  id: string
  userId: string
  bloodGroup?: BloodGroup | null
  allergies?: string | null
  emergencyContact?: string | null
  insuranceNumber?: string | null
  medicalHistory?: string | null
  createdAt: Date
  updatedAt: Date
  user: User
}

export interface Doctor {
  id: string
  userId: string
  specialization: string
  qualification: string
  licenseNumber: string
  department: string
  experience: number
  consultationFee: number
  isAvailable: boolean
  workingDays: string
  workingHoursStart: string
  workingHoursEnd: string
  bio?: string | null
  createdAt: Date
  updatedAt: Date
  user: User
}

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  date: Date
  timeSlot: string
  status: AppointmentStatus
  reason?: string | null
  notes?: string | null
  type: string
  createdAt: Date
  updatedAt: Date
  patient?: Patient
  doctor?: Doctor
}

export interface Bed {
  id: string
  bedNumber: string
  ward: string
  floor: number
  type: BedType
  status: BedStatus
  features: string
  createdAt: Date
  updatedAt: Date
  admissions?: BedAdmission[]
}

export interface BedAdmission {
  id: string
  bedId: string
  patientId: string
  admittedAt: Date
  dischargedAt?: Date | null
  diagnosis?: string | null
  notes?: string | null
  patient?: Patient
}

export interface BloodBank {
  id: string
  bloodGroup: BloodGroup
  unitsAvailable: number
  unitsReserved: number
  lastUpdated: Date
  donorCount: number
}

export interface BloodRequest {
  id: string
  patientName: string
  bloodGroup: BloodGroup
  units: number
  urgency: string
  hospital?: string | null
  contactPhone: string
  status: string
  requestedAt: Date
  fulfilledAt?: Date | null
}

export interface LabReport {
  id: string
  patientId: string
  doctorId?: string | null
  testName: string
  testCategory: string
  status: LabReportStatus
  result?: string | null
  normalRange?: string | null
  remarks?: string | null
  reportUrl?: string | null
  orderedAt: Date
  completedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  patient?: Patient
  doctor?: Doctor | null
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  isRead: boolean
  link?: string | null
  createdAt: Date
}

export interface OrganDonation {
  id: string
  patientId: string
  organs: string
  status: DonationStatus
  registeredAt: Date
  notes?: string | null
  consentForm?: string | null
  patient?: Patient
}

export interface TimeSlot {
  time: string
  available: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}
