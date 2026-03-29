import { z } from "zod"

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "One uppercase letter required")
  .regex(/[a-z]/, "One lowercase letter required")
  .regex(/[0-9]/, "One number required")
  .regex(/[^A-Za-z0-9]/, "One special character required")

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const registerStep1Schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  confirmPassword: z.string(),
  phone: z.string().min(10, "Valid phone number required"),
  role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export const registerPatientSchema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
})

export const registerDoctorSchema = z.object({
  specialization: z.string().min(1, "Specialization required"),
  department: z.string().min(1, "Department required"),
  licenseNumber: z.string().min(1, "License number required"),
  qualification: z.string().min(1, "Qualification required"),
  experience: z.coerce.number().min(0, "Experience must be 0 or more"),
  consultationFee: z.coerce.number().min(0, "Fee must be 0 or more"),
})

export const registerAdminSchema = z.object({
  adminCode: z.string().min(1, "Admin access code required"),
})

export const appointmentSchema = z.object({
  doctorId: z.string().min(1, "Doctor is required"),
  date: z.string().min(1, "Date is required"),
  timeSlot: z.string().min(1, "Time slot is required"),
  reason: z.string().optional(),
  type: z.enum(["IN_PERSON", "TELEMEDICINE"]).default("IN_PERSON"),
})

export const bedAdmitSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  notes: z.string().optional(),
})

export const bloodRequestSchema = z.object({
  patientName: z.string().min(2, "Name required"),
  bloodGroup: z.string().min(1, "Blood group required"),
  units: z.coerce.number().min(1, "At least 1 unit required"),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  hospital: z.string().optional(),
  contactPhone: z.string().min(10, "Valid phone required"),
})

export const labReportSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  testName: z.string().min(1, "Test name is required"),
  testCategory: z.string().min(1, "Category is required"),
  remarks: z.string().optional(),
})

export const labResultSchema = z.object({
  result: z.string().min(1, "Result is required"),
  normalRange: z.string().optional(),
  remarks: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "DELIVERED"]),
})

export const organDonationSchema = z.object({
  organs: z.string().min(1, "Select at least one organ"),
  notes: z.string().optional(),
  consent: z.boolean().refine((v) => v === true, "You must give consent"),
  medicalDeclaration: z.boolean().refine((v) => v === true, "Declaration required"),
})

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: passwordSchema,
  confirmNewPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterStep1Input = z.infer<typeof registerStep1Schema>
export type AppointmentInput = z.infer<typeof appointmentSchema>
export type BedAdmitInput = z.infer<typeof bedAdmitSchema>
export type BloodRequestInput = z.infer<typeof bloodRequestSchema>
export type LabReportInput = z.infer<typeof labReportSchema>
export type LabResultInput = z.infer<typeof labResultSchema>
export type OrganDonationInput = z.infer<typeof organDonationSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
