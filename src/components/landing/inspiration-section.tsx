"use client"

import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { GlitchText } from "@/components/ui/glitch-text"

export function InspirationSection() {
  return (
    <section className="relative z-10 py-24 sm:py-32 px-4">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <div className="font-terminal text-null-muted text-xs uppercase tracking-wider mb-4">
            {">"} SECTION_03 // THE INSPIRATION
          </div>
          <hr className="terminal-divider mb-12" />
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <p className="text-base sm:text-lg text-null-text/80 leading-relaxed mb-6">
            In 2016, Watch Dogs 2 imagined a world where citizens fight back
            against mass surveillance. A world where hackers, whistleblowers,
            and activists draw battle lines against systems designed to
            monitor, profile, and control.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p className="text-base sm:text-lg text-null-text/80 leading-relaxed mb-10">
            10 years later, it&apos;s not fiction anymore. Your toys study your
            children. Your appliances report your habits. Your digital shadow
            is already compromised.
          </p>
        </ScrollReveal>

        {/* Video embed */}
        <ScrollReveal delay={0.3}>
          <div className="relative group">
            {/* Glitch border effect */}
            <div className="absolute -inset-px bg-gradient-to-r from-null-green/20 via-null-cyan/20 to-null-purple/20 rounded opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-null-black rounded overflow-hidden border border-null-border">
              <div className="font-terminal text-xs text-null-muted px-4 py-2 border-b border-null-border flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-null-red" />
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="w-2 h-2 rounded-full bg-null-green" />
                <span className="ml-2">{">"} media://watch-dogs-2-trailer.mp4</span>
              </div>
              <div className="aspect-video">
                <iframe
                  src="https://www.youtube.com/embed/scyA9cnbja4"
                  title="Watch Dogs 2 — We Are DedSec"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <div className="mt-12 p-6 border border-null-green/20 bg-null-green/5 rounded">
            <GlitchText
              text="NullPost is a real tool born from that vision."
              as="p"
              className="font-terminal text-null-green text-sm sm:text-base"
              glitchOnHover
            />
            <p className="mt-2 text-null-text/60 text-sm">
              A private space for your thoughts, protected by encryption, owned by you.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
