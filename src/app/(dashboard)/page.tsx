import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardIndex() {
  const session = await auth()
  const role = session?.user?.role

  if (role === "ADMIN") redirect("/admin/dashboard")
  if (role === "DOCTOR") redirect("/doctor/dashboard")
  redirect("/patient/dashboard")
}
