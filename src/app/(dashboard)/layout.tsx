import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/shared/Sidebar"
import { Topbar } from "@/components/shared/Topbar"
import { ChatbotWidget } from "@/components/shared/ChatbotWidget"
import { SessionProvider } from "next-auth/react"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = session.user.role as string

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-background flex">
        <Sidebar role={role} userName={session.user.name || ""} userEmail={session.user.email || ""} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
        <ChatbotWidget role={role} />
      </div>
    </SessionProvider>
  )
}
