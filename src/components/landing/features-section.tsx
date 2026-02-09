"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import {
  Zap,
  FileText,
  Paperclip,
  Lock,
  Monitor,
  Code,
  EyeOff,
  HardDriveDownload,
} from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

const FEATURES = [
  {
    label: "Quick thoughts",
    description: "Type. Enter. Done.",
    icon: Zap,
  },
  {
    label: "Long-form writing",
    description: "Distraction-free markdown.",
    icon: FileText,
  },
  {
    label: "Media support",
    description: "Images, URLs, audio, video.",
    icon: Paperclip,
  },
  {
    label: "Encrypted",
    description: "AES-256 at rest.",
    icon: Lock,
  },
  {
    label: "Self-hosted",
    description: "One Docker command.",
    icon: Monitor,
  },
  {
    label: "Open source",
    description: "AGPL-3.0 licensed. Transparent.",
    icon: Code,
  },
  {
    label: "No tracking",
    description: "Zero analytics. Zero telemetry.",
    icon: EyeOff,
  },
  {
    label: "Your data",
    description: "Export everything. Anytime.",
    icon: HardDriveDownload,
  },
] as const

export function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <section className="relative z-10 py-24 sm:py-32 px-4" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="font-terminal text-null-muted text-xs uppercase tracking-wider mb-4">
            {">"} SECTION_04 // WHAT YOU GET
          </div>
          <hr className="terminal-divider mb-16" />
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.4,
                  delay: index * 0.08,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="group border border-null-border bg-null-surface/30 p-5 rounded transition-all duration-300 hover:border-null-cyan/30 hover:bg-null-surface/60"
              >
                <Icon className="w-5 h-5 mb-3 text-null-cyan/70 group-hover:text-null-cyan transition-colors" strokeWidth={1.5} />
                <p className="font-terminal text-null-cyan text-sm font-medium">
                  {">"} {feature.label}
                </p>
                <p className="text-null-text/60 text-sm mt-1">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Terminal preview mockup */}
        <ScrollReveal delay={0.3}>
          <div className="mt-16 border border-null-border rounded overflow-hidden bg-null-surface/30">
            <div className="font-terminal text-xs text-null-muted px-4 py-2 border-b border-null-border flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-null-red" />
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="w-2 h-2 rounded-full bg-null-green" />
              <span className="ml-2">{">"} nullpost — feed</span>
            </div>
            <div className="p-6 font-terminal text-sm space-y-4">
              <div className="text-null-muted text-xs">
                2026.02.08 // 14:32:07 // THOUGHT
              </div>
              <div className="border-l-2 border-null-green/40 pl-4">
                <p className="text-null-text/90">
                  Just realized we could use DIDComm for the trust registry
                  handshake instead of raw HTTP. Need to prototype this tomorrow.
                </p>
                <div className="mt-2 flex items-center gap-3 text-null-muted text-xs">
                  <span className="text-null-green inline-flex items-center gap-1">
                    <Lock className="w-3 h-3" /> encrypted
                  </span>
                  <span>·</span>
                  <span>142 chars</span>
                  <span>·</span>
                  <span className="text-null-purple">#work/ssi</span>
                  <span className="text-null-purple">#idea</span>
                </div>
              </div>

              <hr className="terminal-divider" />

              <div className="text-null-muted text-xs">
                2026.02.07 // 23:15:42 // LONG_FORM
              </div>
              <div className="border-l-2 border-null-cyan/40 pl-4">
                <p className="text-null-cyan font-medium">
                  Why Self-Sovereign Identity Matters
                </p>
                <p className="text-null-text/60 mt-1">
                  The premise is simple: you should own your identity the same way
                  you own your house keys...
                </p>
                <div className="mt-2 flex items-center gap-3 text-null-muted text-xs">
                  <span className="text-null-green inline-flex items-center gap-1">
                    <Lock className="w-3 h-3" /> encrypted
                  </span>
                  <span>·</span>
                  <span>2.4k words</span>
                  <span>·</span>
                  <span className="text-null-purple">#essay</span>
                </div>
              </div>

              <div className="text-null-green/50 text-xs cursor-blink mt-4">
                {">"} _
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
