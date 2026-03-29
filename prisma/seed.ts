// @ts-nocheck
/* eslint-disable */
const { PrismaClient } = require("@prisma/client")
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3")
const bcrypt = require("bcryptjs")
const { addDays, format, subDays } = require("date-fns")

const adapter = new PrismaBetterSqlite3({ url: "file:./hosapp.db" })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Starting seed...")

  const PASS = await bcrypt.hash("Test@1234", 12)

  // ─── Admin ───────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@hosapp.com" },
    update: {},
    create: { name: "Admin User", email: "admin@hosapp.com", password: PASS, role: "ADMIN", phone: "9000000001" },
  })
  await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: { userId: adminUser.id, adminCode: "HOSAPP-ADMIN-2025" },
  })
  console.log("✅ Admin created")

  // ─── Doctors ─────────────────────────────────────────────────────────────
  const doctorData = [
    { name: "Arjun Sharma", email: "dr.sharma@hosapp.com", spec: "Cardiology", dept: "Cardiology", lic: "MCI-CAR-001", qual: "MBBS, MD Cardiology", exp: 12, fee: 800, days: "Monday,Tuesday,Wednesday,Thursday,Friday", start: "09:00", end: "17:00", bio: "Expert interventional cardiologist with 12 years at AIIMS." },
    { name: "Priya Nair", email: "dr.nair@hosapp.com", spec: "Neurology", dept: "Neurology", lic: "MCI-NEU-002", qual: "MBBS, DM Neurology", exp: 9, fee: 900, days: "Monday,Wednesday,Friday", start: "10:00", end: "16:00", bio: "Specialist in epilepsy and stroke management." },
    { name: "Suresh Patel", email: "dr.patel@hosapp.com", spec: "Orthopedics", dept: "Orthopedics", lic: "MCI-ORT-003", qual: "MBBS, MS Ortho", exp: 15, fee: 700, days: "Tuesday,Thursday,Saturday", start: "08:00", end: "14:00", bio: "Joint replacement and sports injury specialist." },
    { name: "Kavita Iyer", email: "dr.iyer@hosapp.com", spec: "Pediatrics", dept: "Pediatrics", lic: "MCI-PED-004", qual: "MBBS, MD Pediatrics", exp: 7, fee: 500, days: "Monday,Tuesday,Wednesday,Thursday,Friday", start: "09:00", end: "15:00", bio: "Child specialist with focus on developmental disorders." },
    { name: "Ravi Mehta", email: "dr.mehta@hosapp.com", spec: "Dermatology", dept: "Dermatology", lic: "MCI-DER-005", qual: "MBBS, MD Derma", exp: 6, fee: 600, days: "Monday,Wednesday,Friday,Saturday", start: "11:00", end: "17:00", bio: "Expert in skin disorders and cosmetic dermatology." },
    { name: "Ananya Roy", email: "dr.roy@hosapp.com", spec: "General Medicine", dept: "General Medicine", lic: "MCI-GEN-006", qual: "MBBS, MD Medicine", exp: 11, fee: 400, days: "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday", start: "08:00", end: "13:00", bio: "General physician with expertise in internal medicine." },
    { name: "Vikram Singh", email: "dr.singh@hosapp.com", spec: "Oncology", dept: "Oncology", lic: "MCI-ONC-007", qual: "MBBS, DM Oncology", exp: 14, fee: 1200, days: "Tuesday,Thursday", start: "10:00", end: "15:00", bio: "Specialist in chemotherapy and cancer management." },
    { name: "Meera Reddy", email: "dr.reddy@hosapp.com", spec: "Gynecology", dept: "Gynecology", lic: "MCI-GYN-008", qual: "MBBS, MS OBG", exp: 10, fee: 700, days: "Monday,Tuesday,Wednesday,Thursday,Friday", start: "09:00", end: "16:00", bio: "Expert in maternal health and reproductive medicine." },
  ]

  const doctors: { doctor: Awaited<ReturnType<typeof prisma.doctor.upsert>>; user: Awaited<ReturnType<typeof prisma.user.upsert>> }[] = []
  for (const d of doctorData) {
    const user = await prisma.user.upsert({
      where: { email: d.email }, update: {},
      create: { name: d.name, email: d.email, password: PASS, role: "DOCTOR", phone: `90000000${doctors.length + 10}` },
    })
    const doctor = await prisma.doctor.upsert({
      where: { userId: user.id }, update: {},
      create: { userId: user.id, specialization: d.spec, department: d.dept, licenseNumber: d.lic, qualification: d.qual, experience: d.exp, consultationFee: d.fee, isAvailable: true, workingDays: d.days, workingHoursStart: d.start, workingHoursEnd: d.end, bio: d.bio },
    })
    doctors.push({ doctor, user })
  }
  console.log("✅ 8 doctors created")

  // ─── Patients ─────────────────────────────────────────────────────────────
  const bloodGroups = ["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"]
  const patientNames = [
    "Rahul Kumar", "Sneha Verma", "Amit Joshi", "Pooja Desai", "Kiran Shah",
    "Neha Gupta", "Raju Mishra", "Divya Pillai", "Ajay Nair", "Sunita Rao",
    "Mahesh Tiwari", "Anita Sharma", "Deepak Patel", "Rekha Singh", "Sanjay Dubey",
    "Geeta Menon", "Rohit Yadav", "Prabhakaran S", "Lalita Devi", "Naresh Kumar",
    "Farzana Begum", "Yusuf Khan", "Harpreet Kaur", "Gurpreet Singh", "Lakshmi N",
  ]

  const patients: Awaited<ReturnType<typeof prisma.patient.upsert>>[] = []
  for (let i = 0; i < 25; i++) {
    const email = `patient${i + 1}@hosapp.com`
    const user = await prisma.user.upsert({
      where: { email }, update: {},
      create: { name: patientNames[i], email, password: PASS, role: "PATIENT", phone: `98765${String(i + 10000).slice(-5)}`, gender: i % 2 === 0 ? "Male" : "Female", dateOfBirth: new Date(1980 + (i % 30), i % 12, (i % 28) + 1) },
    })
    const patient = await prisma.patient.upsert({
      where: { userId: user.id }, update: {},
      create: { userId: user.id, bloodGroup: bloodGroups[i % 8], allergies: i % 3 === 0 ? "Penicillin" : i % 5 === 0 ? "Sulfa drugs" : null, emergencyContact: `+91-9999${String(i + 10000).slice(-5)}`, insuranceNumber: `INS-${1000 + i}`, medicalHistory: i % 4 === 0 ? "Hypertension" : i % 7 === 0 ? "Diabetes Type 2" : null },
    })
    patients.push(patient)
  }
  console.log("✅ 25 patients created")

  // ─── Beds ─────────────────────────────────────────────────────────────────
  const bedStatuses = ["AVAILABLE", "AVAILABLE", "AVAILABLE", "OCCUPIED", "MAINTENANCE"]
  let bedIdx = 0
  const bedConfigs = [
    { type: "ICU", ward: "ICU Ward", count: 15, floor: 3 },
    { type: "GENERAL", ward: "General Ward A", count: 15, floor: 1 },
    { type: "GENERAL", ward: "General Ward B", count: 15, floor: 2 },
    { type: "EMERGENCY", ward: "Emergency", count: 10, floor: 0 },
    { type: "PRIVATE", ward: "Private Wing", count: 5, floor: 4 },
  ]
  for (const cfg of bedConfigs) {
    for (let i = 0; i < cfg.count; i++) {
      bedIdx++
      const bedNum = `${cfg.type.slice(0, 1)}${String(bedIdx).padStart(3, "0")}`
      await prisma.bed.upsert({
        where: { bedNumber: bedNum }, update: {},
        create: { bedNumber: bedNum, ward: cfg.ward, floor: cfg.floor, type: cfg.type, status: bedStatuses[bedIdx % bedStatuses.length], features: cfg.type === "ICU" ? "Ventilator,Monitor,O2" : cfg.type === "PRIVATE" ? "AC,TV,Attached Bath" : "Basic" },
      })
    }
  }
  console.log("✅ 60 beds created")

  // ─── Blood Bank ───────────────────────────────────────────────────────────
  const bloodBankData = [
    { bloodGroup: "A_POS", units: 45, reserved: 5, donors: 18 },
    { bloodGroup: "A_NEG", units: 12, reserved: 2, donors: 4 },
    { bloodGroup: "B_POS", units: 38, reserved: 8, donors: 14 },
    { bloodGroup: "B_NEG", units: 8, reserved: 1, donors: 3 },
    { bloodGroup: "AB_POS", units: 22, reserved: 4, donors: 8 },
    { bloodGroup: "AB_NEG", units: 4, reserved: 0, donors: 1 },
    { bloodGroup: "O_POS", units: 60, reserved: 15, donors: 24 },
    { bloodGroup: "O_NEG", units: 3, reserved: 0, donors: 1 },
  ]
  for (const bb of bloodBankData) {
    await prisma.bloodBank.upsert({ where: { bloodGroup: bb.bloodGroup }, update: { unitsAvailable: bb.units, unitsReserved: bb.reserved, donorCount: bb.donors }, create: { bloodGroup: bb.bloodGroup, unitsAvailable: bb.units, unitsReserved: bb.reserved, donorCount: bb.donors } })
  }
  console.log("✅ Blood bank stocked")

  // ─── Appointments ─────────────────────────────────────────────────────────
  const statuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED"]
  const timeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00", "15:30"]
  for (let i = 0; i < 40; i++) {
    const patient = patients[i % patients.length]
    const { doctor } = doctors[i % doctors.length]
    const daysOffset = i < 20 ? -(i % 14) : (i % 14)
    await prisma.appointment.create({
      data: { patientId: patient.id, doctorId: doctor.id, date: addDays(new Date(), daysOffset), timeSlot: timeSlots[i % timeSlots.length], status: statuses[i % statuses.length], reason: ["Chest pain", "Headache", "Joint pain", "Fever", "Skin rash", "Routine checkup", "Follow-up"][i % 7], type: i % 3 === 0 ? "TELEMEDICINE" : "IN_PERSON" },
    })
  }
  console.log("✅ 40 appointments created")

  // ─── Lab Reports ──────────────────────────────────────────────────────────
  const labTests = [
    { name: "Complete Blood Count", category: "Blood Test", result: "Normal", range: "WBC: 4.5-11.0 K/µL" },
    { name: "Lipid Profile", category: "Blood Test", result: "Total Cholesterol: 195 mg/dL", range: "< 200 mg/dL" },
    { name: "Blood Glucose", category: "Blood Test", result: "102 mg/dL", range: "70-100 mg/dL (fasting)" },
    { name: "Urine Routine", category: "Urine Test", result: "Normal", range: "Standard values" },
    { name: "Chest X-Ray", category: "X-Ray", result: "No abnormality detected", range: "N/A" },
    { name: "Thyroid Profile", category: "Blood Test", result: "TSH: 2.3 mIU/L", range: "0.4-4.0 mIU/L" },
    { name: "Liver Function Test", category: "Blood Test", result: "ALT: 32 U/L", range: "7-56 U/L" },
    { name: "ECG", category: "ECG", result: "Normal sinus rhythm", range: "N/A" },
    { name: "MRI Brain", category: "MRI", result: "Pending radiologist review", range: "N/A" },
    { name: "Urine Culture", category: "Culture Test", result: "No growth", range: "N/A" },
  ]
  const labStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "DELIVERED", "PENDING"]
  for (let i = 0; i < 20; i++) {
    const patient = patients[i % patients.length]
    const { doctor } = doctors[i % doctors.length]
    const lab = labTests[i % labTests.length]
    const status = labStatuses[i % labStatuses.length]
    await prisma.labReport.create({
      data: { patientId: patient.id, doctorId: doctor.id, testName: lab.name, testCategory: lab.category, status, result: status === "COMPLETED" || status === "DELIVERED" ? lab.result : null, normalRange: status === "COMPLETED" || status === "DELIVERED" ? lab.range : null, remarks: status === "COMPLETED" ? "Results within acceptable range" : null, orderedAt: subDays(new Date(), i % 14), completedAt: status === "COMPLETED" || status === "DELIVERED" ? subDays(new Date(), (i % 14) - 2) : null },
    })
  }
  console.log("✅ 20 lab reports created")

  // ─── Notifications ────────────────────────────────────────────────────────
  const allUsers = await prisma.user.findMany({ take: 10 })
  const notifTypes = ["appointment", "lab", "blood", "system", "alert"]
  const notifs = [
    "Your appointment with Dr. Sharma is confirmed for tomorrow.",
    "Lab report for CBC is ready for download.",
    "Blood group O- is critically low. Donors needed urgently.",
    "System maintenance scheduled for Sunday 02:00–04:00 AM.",
    "New appointment request from patient Rahul Kumar.",
    "Your lab test results are available.",
    "Appointment cancelled: Dr. Nair is on leave.",
    "Blood donation camp: Saturday, 10 AM at HOSAPP.",
    "Reminder: Annual health checkup is due.",
    "Your prescription has been updated by Dr. Mehta.",
    "ICU bed #I005 is now available.",
    "Emergency contact updated successfully.",
    "Your profile has been updated.",
    "Appointment rescheduled to next Wednesday.",
    "Welcome to HOSAPP! Complete your profile.",
  ]
  for (let i = 0; i < 15; i++) {
    const user = allUsers[i % allUsers.length]
    await prisma.notification.create({
      data: { userId: user.id, title: notifs[i].split(":")[0].slice(0, 40), message: notifs[i], type: notifTypes[i % notifTypes.length], isRead: i % 3 === 0 },
    })
  }
  console.log("✅ 15 notifications created")

  // ─── Organ Donations ─────────────────────────────────────────────────────
  const donationOrgans = ["Heart,Liver,Kidney", "Liver,Lungs,Cornea", "Kidney,Pancreas", "Heart,Liver,Kidney,Lungs,Cornea", "Kidney"]
  const donationStatuses = ["REGISTERED", "UNDER_REVIEW", "APPROVED", "REGISTERED", "REGISTERED"]
  for (let i = 0; i < 5; i++) {
    await prisma.organDonation.create({
      data: { patientId: patients[i].id, organs: donationOrgans[i], status: donationStatuses[i] },
    })
  }
  console.log("✅ 5 organ donations created")

  // ─── Doctor Schedules (next 14 days) ─────────────────────────────────────
  for (const { doctor } of doctors) {
    const d = await prisma.doctor.findUnique({ where: { id: doctor.id } })
    if (!d) continue
    const wdays = d.workingDays.split(",").map(s => s.trim())
    for (let i = 0; i < 14; i++) {
      const date = addDays(new Date(), i)
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" })
      if (!wdays.includes(dayName)) continue
      await prisma.doctorSchedule.create({
        data: { doctorId: doctor.id, date, startTime: d.workingHoursStart, endTime: d.workingHoursEnd, isBooked: false },
      })
    }
  }
  console.log("✅ Doctor schedules created for 14 days")

  console.log("\n🎉 Seed completed successfully!")
  console.log("─────────────────────────────────────")
  console.log("Admin:   admin@hosapp.com / Test@1234")
  console.log("Doctor:  dr.sharma@hosapp.com / Test@1234")
  console.log("Patient: patient1@hosapp.com / Test@1234")
  console.log("─────────────────────────────────────")
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
