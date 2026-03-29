// Email is optional — if SMTP is not configured, emails are silently skipped.
export async function sendEmail(_opts: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  // No SMTP configured — silently skip
  return
}

export function appointmentConfirmationEmail(data: {
  patientName: string
  doctorName: string
  date: string
  timeSlot: string
}): string {
  return `
    <div style="font-family: DM Sans, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0A6EBD; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">HOSAPP</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">Hospital Management System</p>
      </div>
      <div style="background: #fff; padding: 32px; border: 1px solid #E2E8F0; border-top: 0; border-radius: 0 0 8px 8px;">
        <h2>Appointment Confirmed</h2>
        <p>Dear <strong>${data.patientName}</strong>,</p>
        <p>Your appointment has been successfully booked.</p>
        <div style="background: #F8FAFC; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Doctor:</strong> Dr. ${data.doctorName}</p>
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Time:</strong> ${data.timeSlot}</p>
        </div>
        <p>Please arrive 10 minutes before your scheduled time.</p>
        <p style="color: #64748B; font-size: 14px;">© 2025 HOSAPP. All rights reserved.</p>
      </div>
    </div>
  `
}
