"use client"

import { GlitchText } from "@/components/ui/glitch-text"
import { SITE_CONFIG } from "@/lib/constants"

export function FooterSection() {
  return (
    <footer className="relative z-10 py-16 px-4 border-t border-null-border">
      <div className="max-w-3xl mx-auto text-center">
        <GlitchText
          text={`"Going dark is no longer an option. Going sovereign is."`}
          as="p"
          className="text-null-green/70 text-sm sm:text-base mb-8"
          glitchOnHover
        />

        <div className="flex items-center justify-center gap-6 font-terminal text-xs text-null-muted">
          <span>
            Built by{" "}
            <a
              href={SITE_CONFIG.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-null-cyan hover:text-null-cyan/80 transition-colors"
            >
              {SITE_CONFIG.author}
            </a>
          </span>
          <span className="text-null-dim">·</span>
          <span>Open Source</span>
          <span className="text-null-dim">·</span>
          <a
            href={SITE_CONFIG.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-null-cyan hover:text-null-cyan/80 transition-colors"
          >
            AGPL-3.0
          </a>
        </div>

        <div className="mt-8 font-terminal text-null-dim text-xs">
          {">"} /dev/null — where your data goes to be free
        </div>
      </div>
    </footer>
  )
}
