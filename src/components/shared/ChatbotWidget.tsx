"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MessageCircle, X, Send, Bot, Mic, MicOff, Volume2, VolumeX, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Message {
  id: string
  text: string
  isBot: boolean
  timestamp: Date
  chips?: string[]
}

const INITIAL_MESSAGE: Message = {
  id: "0",
  text: "Hi! I'm your HOSAPP assistant. Ask me anything or tap the mic to speak.",
  isBot: true,
  timestamp: new Date(),
  chips: ["Book Appointment", "Check Lab Reports", "Blood Bank Status", "Bed Availability", "Emergency Help"],
}

// ── Speech synthesis helper ───────────────────────────────────────────────────
function useSpeech() {
  const speakingRef = useRef(false)

  const getVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices()
    return (
      voices.find((v) => v.lang === "en-IN") ||
      voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0] ||
      null
    )
  }

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    speakingRef.current = true

    // Strip markdown bold markers for TTS
    const clean = text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\n/g, ". ")

    const utter = new SpeechSynthesisUtterance(clean)
    utter.rate = 0.92
    utter.pitch = 1.05
    utter.volume = 1

    const doSpeak = () => {
      const voice = getVoice()
      if (voice) utter.voice = voice
      utter.onend = () => { speakingRef.current = false }
      utter.onerror = () => { speakingRef.current = false }
      window.speechSynthesis.speak(utter)
    }

    // Voices may not be loaded yet — wait for them
    if (window.speechSynthesis.getVoices().length > 0) {
      doSpeak()
    } else {
      window.speechSynthesis.onvoiceschanged = doSpeak
    }
  }, [])

  const stop = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis.cancel()
    speakingRef.current = false
  }, [])

  return { speak, stop, speakingRef }
}

// Web Speech API types — not included in TS's default lib
interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((e: SpeechRecognitionResultEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
interface SpeechRecognitionResultEvent {
  resultIndex: number
  results: { [i: number]: { [j: number]: { transcript: string }; isFinal: boolean }; length: number }
}

// ── Speech recognition hook ──────────────────────────────────────────────────
function useSpeechRecognition(onResult: (text: string) => void) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState("")

  const start = useCallback(() => {
    if (typeof window === "undefined") return

    const win = window as unknown as Record<string, unknown>
    const SR = (win["SpeechRecognition"] || win["webkitSpeechRecognition"]) as
      | (new () => SpeechRecognitionInstance)
      | undefined

    if (!SR) {
      toast.error("Voice recognition is not supported in this browser. Please use Chrome or Edge.")
      return
    }

    const rec = new SR()
    rec.lang = "en-IN"
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1
    recognitionRef.current = rec

    rec.onstart = () => { setListening(true); setInterim("") }

    rec.onresult = (e: SpeechRecognitionResultEvent) => {
      let finalText = ""
      let interimText = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += t
        else interimText += t
      }
      setInterim(interimText || finalText)
      if (finalText) {
        setInterim(finalText)
        onResult(finalText.trim())
      }
    }

    rec.onerror = (e: { error: string }) => {
      setListening(false)
      setInterim("")
      if (e.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow mic access in your browser settings.")
      } else if (e.error !== "aborted") {
        toast.error("Could not hear you clearly. Please try again.")
      }
    }

    rec.onend = () => { setListening(false); setInterim("") }

    try {
      rec.start()
    } catch {
      toast.error("Could not start voice recognition.")
      setListening(false)
    }
  }, [onResult])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
    setInterim("")
  }, [])

  return { listening, interim, start, stop }
}

// ── Main Widget ─────────────────────────────────────────────────────────────
export function ChatbotWidget({ role }: { role: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sessionId = useRef(Math.random().toString(36).slice(2))
  const router = useRouter()

  const { speak, stop: stopSpeak } = useSpeech()

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg: Message = {
      id: Date.now().toString(),
      text: trimmed,
      isBot: false,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setTyping(true)
    stopSpeak()

    try {
      await new Promise((r) => setTimeout(r, 400))

      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, sessionId: sessionId.current }),
      })
      const data = await res.json()
      const { response, action, chips } = data.data || {}

      setTyping(false)

      const botText = response || "I can help with appointments, lab reports, blood bank, and more."
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        isBot: true,
        timestamp: new Date(),
        chips: chips || [],
      }
      setMessages((prev) => [...prev, botMsg])

      // Speak the response
      if (ttsEnabled) speak(botText)

      // Handle navigation actions
      if (action?.startsWith("navigate:")) {
        const path = action.replace("navigate:", "")
        const resolvedPath =
          path === "dashboard"
            ? role === "ADMIN" ? "/admin/dashboard" : role === "DOCTOR" ? "/doctor/dashboard" : "/patient/dashboard"
            : path === "profile"
            ? `/${role.toLowerCase()}/profile`
            : path
        setTimeout(() => router.push(resolvedPath), 900)
      }
    } catch {
      setTyping(false)
      const errMsg: Message = {
        id: (Date.now() + 2).toString(),
        text: "Something went wrong. Please try again.",
        isBot: true,
        timestamp: new Date(),
        chips: [],
      }
      setMessages((prev) => [...prev, errMsg])
    }
  }, [role, router, speak, stopSpeak, ttsEnabled])

  // Voice recognition — sends final transcript to sendMessage
  const { listening, interim, start: startListening, stop: stopListening } = useSpeechRecognition(sendMessage)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  // Focus input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const handleReset = () => {
    stopSpeak()
    setMessages([INITIAL_MESSAGE])
    setInput("")
    setTyping(false)
  }

  const handleMicClick = () => {
    if (listening) {
      stopListening()
    } else {
      stopSpeak()
      startListening()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="w-[390px] max-w-[calc(100vw-32px)] h-[520px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ animation: "slideUp 0.2s ease-out" }}
        >
          {/* ── Header ─────────────────────────────────────────── */}
          <div className="medical-gradient px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">HOSAPP Assistant</p>
                <p className="text-white/70 text-xs">
                  {listening ? "🎙 Listening…" : "Online · Medical AI"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* TTS toggle */}
              <button
                onClick={() => { setTtsEnabled((v) => !v); if (ttsEnabled) stopSpeak() }}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label={ttsEnabled ? "Mute voice" : "Enable voice"}
                title={ttsEnabled ? "Mute voice" : "Enable voice"}
              >
                {ttsEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>
              {/* Reset */}
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Reset chat"
                title="Reset conversation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              {/* Close */}
              <button
                onClick={() => { setOpen(false); stopSpeak(); if (listening) stopListening() }}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Voice interim display ────────────────────────── */}
          {listening && (
            <div className="bg-[#0A6EBD]/5 border-b border-[#0A6EBD]/20 px-4 py-2 flex items-center gap-2">
              <div className="flex gap-0.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-0.5 h-4 bg-[#0A6EBD] rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
              <p className="text-xs text-[#0A6EBD] font-medium flex-1 truncate">
                {interim || "Listening… speak now"}
              </p>
              <button onClick={stopListening} className="text-xs text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          )}

          {/* ── Messages ─────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-2.5", msg.isBot ? "justify-start" : "justify-end")}>
                {msg.isBot && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0A6EBD] to-[#00B4A6] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className={cn("max-w-[78%] space-y-1.5")}>
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                      msg.isBot
                        ? "bg-muted text-foreground rounded-tl-sm"
                        : "bg-[#0A6EBD] text-white rounded-tr-sm"
                    )}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: msg.text
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/🚨/g, '<span class="text-base">🚨</span>')
                          .replace(/•/g, "•")
                          .replace(/\n/g, "<br/>"),
                      }}
                    />
                  </div>
                  <p className={cn("text-[10px] text-muted-foreground px-1", !msg.isBot && "text-right")}>
                    {format(msg.timestamp, "HH:mm")}
                  </p>
                  {/* Quick-reply chips */}
                  {msg.isBot && msg.chips && msg.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {msg.chips.slice(0, 4).map((chip) => (
                        <button
                          key={chip}
                          onClick={() => sendMessage(chip)}
                          className="text-xs px-2.5 py-1 rounded-full border border-[#0A6EBD]/40 text-[#0A6EBD] hover:bg-[#0A6EBD] hover:text-white transition-colors font-medium"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="flex gap-2.5 items-end">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0A6EBD] to-[#00B4A6] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 shadow-sm">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input bar ─────────────────────────────────────── */}
          <div className="border-t border-border p-3 flex gap-2 flex-shrink-0 bg-card">
            {/* Mic button */}
            <button
              onClick={handleMicClick}
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                listening
                  ? "bg-red-500 text-white shadow-md shadow-red-200 dark:shadow-red-900/30 animate-pulse"
                  : "bg-muted text-muted-foreground hover:bg-[#0A6EBD]/10 hover:text-[#0A6EBD]"
              )}
              aria-label={listening ? "Stop listening" : "Start voice input"}
              title={listening ? "Stop listening" : "Speak your message"}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            {/* Text input */}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(input)
                }
              }}
              placeholder={listening ? "Listening…" : "Type or speak a message…"}
              disabled={listening}
              className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 outline-none border border-transparent focus:border-[#0A6EBD]/40 transition-colors placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {/* Send button */}
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || listening}
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                input.trim() && !listening
                  ? "bg-[#0A6EBD] text-white hover:bg-[#0957a0] shadow-sm"
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              )}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── FAB toggle button ─────────────────────────────── */}
      <button
        onClick={() => {
          setOpen((o) => {
            if (o) { stopSpeak(); if (listening) stopListening() }
            return !o
          })
        }}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 relative",
          "bg-[#0A6EBD] hover:bg-[#0957a0] text-white",
          open && "rotate-0 scale-95"
        )}
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        {open
          ? <X className="h-6 w-6" />
          : <MessageCircle className="h-6 w-6" />
        }
        {/* Online dot */}
        {!open && (
          <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-white shadow-sm" />
        )}
      </button>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  )
}
