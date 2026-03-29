export interface Intent {
  patterns: string[]
  response: string
  action?: string
  chips?: string[]
}

export const intents: Intent[] = [
  {
    patterns: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"],
    response: "Hi there! I'm your HOSAPP assistant. How can I help you today?",
    chips: ["Book Appointment", "Check Lab Reports", "Blood Bank Status"],
  },
  {
    patterns: ["book", "appointment", "schedule", "visit", "consult"],
    response: "You can book an appointment in the Appointments section. Choose your department, doctor, date, and time slot.",
    action: "navigate:/patient/appointments",
    chips: ["Find a Doctor", "My Appointments"],
  },
  {
    patterns: ["lab", "report", "test", "result", "blood test", "scan"],
    response: "Your lab reports are available in the Lab Reports section. You can view results and download completed reports.",
    action: "navigate:/patient/lab-reports",
    chips: ["View Reports", "Book Appointment"],
  },
  {
    patterns: ["blood", "blood bank", "donate blood", "blood group", "transfusion"],
    response: "Let me check the blood bank status for you.",
    action: "fetch:blood-bank",
    chips: ["Request Blood", "Organ Donation"],
  },
  {
    patterns: ["bed", "ward", "icu", "admission", "hospital bed", "room"],
    response: "Let me check bed availability.",
    action: "fetch:beds",
    chips: ["Book Appointment"],
  },
  {
    patterns: ["emergency", "urgent", "ambulance", "help", "critical"],
    response: "🚨 **Emergency Contacts:**\n• Ambulance: **108**\n• Hospital: **+91-1800-HOSAPP**\n• Emergency Desk: **+91-9999-000000**",
    chips: ["Book Appointment", "Blood Bank Status"],
  },
  {
    patterns: ["organ", "donate", "donation", "organ donor"],
    response: "Organ donation is a noble decision. You can register as an organ donor in our Organ Donation section.",
    action: "navigate:/patient/organ-donation",
    chips: ["Register as Donor", "Blood Bank Status"],
  },
  {
    patterns: ["doctor", "find doctor", "specialist", "physician"],
    response: "Use 'Find a Doctor' to browse specialists by department, availability, and fee.",
    action: "navigate:/patient/appointments",
    chips: ["Book Appointment", "Find a Doctor"],
  },
  {
    patterns: ["logout", "sign out", "signout", "log out"],
    response: "To sign out, click your avatar in the top-right corner and select 'Logout'. You'll be asked to confirm.",
    chips: ["Go to Dashboard"],
  },
  {
    patterns: ["notification", "alerts", "updates", "messages"],
    response: "Your notifications appear in the bell icon in the top navigation bar. You can mark them as read there.",
    chips: ["Go to Dashboard"],
  },
  {
    patterns: ["dashboard", "home", "main", "overview"],
    response: "Navigating you to your dashboard!",
    action: "navigate:dashboard",
    chips: ["Book Appointment", "Check Lab Reports"],
  },
  {
    patterns: ["profile", "account", "settings", "personal"],
    response: "You can update your profile information, contact details, and change your password in the Profile section.",
    action: "navigate:profile",
    chips: ["Book Appointment"],
  },
]

export function matchIntent(message: string): Intent {
  const lower = message.toLowerCase().trim()
  for (const intent of intents) {
    if (intent.patterns.some((p) => lower.includes(p))) {
      return intent
    }
  }
  return {
    patterns: [],
    response: "I can help with appointments, lab reports, blood bank, bed availability, and emergencies. What do you need?",
    chips: ["Book Appointment", "Check Lab Reports", "Blood Bank Status", "Emergency Help"],
  }
}
