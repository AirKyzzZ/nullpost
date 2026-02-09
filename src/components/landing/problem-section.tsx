"use client"

import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { GlitchText } from "@/components/ui/glitch-text"

export function ProblemSection() {
  return (
    <section className="relative z-10 py-24 sm:py-32 px-4">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <div className="font-terminal text-null-muted text-xs uppercase tracking-wider mb-8">
            {">"} SECTION_01 // THE PROBLEM
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <blockquote className="border-l-2 border-null-green pl-6 py-2 mb-10">
            <GlitchText
              text={`"You are now less valuable than the data you produce."`}
              as="p"
              className="text-xl sm:text-2xl md:text-3xl font-terminal text-null-green glow-green leading-relaxed"
              glitchOnHover
            />
            <footer className="mt-4 font-terminal text-null-muted text-xs">
              — Watch Dogs 2, Ubisoft (2016)
            </footer>
          </blockquote>
        </ScrollReveal>

        <div className="space-y-6 text-null-text/80 leading-relaxed">
          <ScrollReveal delay={0.2}>
            <p className="text-base sm:text-lg">
              Every thought you type on a platform becomes their product.
              Your journal entries train their AI. Your private reflections
              fuel their ad engine. Your digital shadow is bought, sold,
              and stolen — in an instant.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <p className="text-base sm:text-lg">
              You don&apos;t own your words on Medium, Twitter, or Notion.
              They do. Your data lives on their servers, under their terms,
              subject to their decisions.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.4}>
            <div className="mt-10 p-4 border border-null-red/30 bg-null-red/5 rounded">
              <p className="font-terminal text-null-red text-sm">
                {">"} STATUS: UNACCEPTABLE
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
