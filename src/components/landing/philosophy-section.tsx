"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Server, ShieldCheck, GitFork } from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

const PILLARS = [
  {
    title: "SOVEREIGNTY",
    icon: Server,
    description:
      "Your words live on YOUR server. No corporation can delete, sell, or mine them. You control the data. You control the narrative.",
    color: "text-null-green",
  },
  {
    title: "PRIVACY",
    icon: ShieldCheck,
    description:
      "Encrypted at rest. No tracking. No analytics. No third parties. Ever. Your thoughts are between you and your server.",
    color: "text-null-cyan",
  },
  {
    title: "FREEDOM",
    icon: GitFork,
    description:
      "Open source. Self-hosted. Fork it. Modify it. Own it. Forever. No vendor lock-in. No platform dependency.",
    color: "text-null-purple",
  },
] as const

export function PhilosophySection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="relative z-10 py-24 sm:py-32 px-4" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="font-terminal text-null-muted text-xs uppercase tracking-wider mb-4">
            {">"} SECTION_02 // THE PHILOSOPHY
          </div>
          <hr className="terminal-divider mb-16" />
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLARS.map((pillar, index) => {
            const Icon = pillar.icon
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="group relative border border-null-border bg-null-surface/50 p-6 sm:p-8 rounded transition-all duration-300 hover:border-null-green/30 hover:border-glow-green"
              >
                <div className="font-terminal text-xs text-null-muted mb-4 uppercase tracking-wider">
                  {">"} {pillar.title}
                </div>

                <Icon className={`w-7 h-7 mb-4 ${pillar.color}`} strokeWidth={1.5} />

                <h3 className={`font-terminal text-lg font-bold mb-3 ${pillar.color}`}>
                  {pillar.title}
                </h3>

                <p className="text-null-text/70 text-sm leading-relaxed">
                  {pillar.description}
                </p>

                {/* Corner decorations */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-null-green/20 rounded-tl" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-null-green/20 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-null-green/20 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-null-green/20 rounded-br" />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
