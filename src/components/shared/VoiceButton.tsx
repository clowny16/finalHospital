"use client"

import { useState, useCallback } from "react"
import { Mic, MicOff, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface VoiceButtonProps {
  role: string
}

export function VoiceButton({ role }: VoiceButtonProps) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [showCard, setShowCard] = useState(false)
  const router = useRouter()

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    const female = voices.find(v => v.lang === "en-US" && v.name.includes("Female")) || voices.find(v => v.lang.startsWith("en")) || voices[0]
    if (female) utterance.voice = female
    utterance.rate = 0.95
    window.speechSynthesis.speak(utterance)
  }

  const handleIntent = useCallback((text: string) => {
    const lower = text.toLowerCase()

    if (lower.includes("book") || lower.includes("appointment")) {
      router.push("/patient/appointments")
      speak("Navigating to appointments.")
    } else if (lower.includes("lab") || lower.includes("report") || lower.includes("test")) {
      router.push("/patient/lab-reports")
      speak("Opening lab reports.")
    } else if (lower.includes("blood")) {
      router.push(role === "ADMIN" ? "/admin/blood-bank" : "/patient/blood-bank")
      speak("Opening blood bank.")
    } else if (lower.includes("bed") || lower.includes("ward") || lower.includes("icu")) {
      if (role === "ADMIN") {
        router.push("/admin/beds")
        speak("Opening bed management.")
      } else {
        speak("Bed management is available to administrators.")
      }
    } else if (lower.includes("doctor") || lower.includes("find doctor")) {
      router.push("/patient/appointments")
      speak("Opening find a doctor.")
    } else if (lower.includes("dashboard") || lower.includes("home")) {
      const dash = role === "ADMIN" ? "/admin/dashboard" : role === "DOCTOR" ? "/doctor/dashboard" : "/patient/dashboard"
      router.push(dash)
      speak("Going to your dashboard.")
    } else if (lower.includes("donate") || lower.includes("organ")) {
      router.push("/patient/organ-donation")
      speak("Opening organ donation page.")
    } else if (lower.includes("logout") || lower.includes("sign out")) {
      speak("Signing you out.")
      setTimeout(() => signOut({ callbackUrl: "/login" }), 1500)
    } else if (lower.includes("notification")) {
      speak("Your notifications are in the bell icon at the top.")
    } else {
      speak("I didn't understand. Try saying: book appointment, check lab reports, or go to dashboard.")
    }
  }, [role, router])

  const startListening = () => {
    if (typeof window === "undefined") return
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error("Voice recognition not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    setListening(true)
    setShowCard(true)
    setTranscript("Listening...")

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const t = event.results[0][0].transcript
      setTranscript(t)
      if (event.results[0].isFinal) {
        handleIntent(t)
        setListening(false)
        setTimeout(() => setShowCard(false), 3000)
      }
    }

    recognition.onerror = () => {
      setListening(false)
      setTimeout(() => setShowCard(false), 2000)
      toast.error("Could not hear you. Please try again.")
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognition.start()
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-2">
      {showCard && (
        <div className="bg-card border border-border shadow-lg rounded-xl px-4 py-3 max-w-xs animate-slide-up">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("text-sm", transcript === "Listening..." && "italic text-muted-foreground")}>
              {transcript}
            </p>
            <button onClick={() => setShowCard(false)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={startListening}
        disabled={listening}
        className={cn(
          "w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200",
          "bg-[#0A6EBD] hover:bg-[#0957a0] text-white",
          listening && "animate-pulse-ring"
        )}
        aria-label="Voice assistant"
      >
        {listening ? <MicOff className="h-5 w-5 text-red-300" /> : <Mic className="h-5 w-5" />}
      </button>
    </div>
  )
}
