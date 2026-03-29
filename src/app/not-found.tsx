import Link from "next/link"
import { ActivitySquare, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <svg viewBox="0 0 200 80" className="w-48 h-20 text-[#0A6EBD]">
              <polyline points="0,40 20,40 30,10 40,70 50,35 60,45 70,40 90,40" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="90" y1="40" x2="200" y2="40" stroke="hsl(var(--muted-foreground))" strokeWidth="3" strokeDasharray="8,4" strokeOpacity="0.3" />
            </svg>
          </div>
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-fraunces)" }}>404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-3" style={{ fontFamily: "var(--font-fraunces)" }}>Page Not Found</h2>
        <p className="text-muted-foreground mb-8">The page you were looking for doesn&apos;t exist or may have been moved. Let&apos;s get you back on track.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/"><Button className="bg-[#0A6EBD] hover:bg-[#0957a0]"><Home className="mr-2 h-4 w-4" />Go to Dashboard</Button></Link>
          <Link href="/login"><Button variant="outline">Sign In</Button></Link>
        </div>
      </div>
    </div>
  )
}
