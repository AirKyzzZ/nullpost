"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { AsciiLogo } from "@/components/ui/ascii-logo"
import { TerminalText } from "@/components/ui/terminal-text"
import { MatrixRain } from "@/components/ui/matrix-rain"
import { BOOT_SEQUENCE } from "@/lib/constants"

export function HeroSection() {
  const [bootComplete, setBootComplete] = useState(false)

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      <MatrixRain />

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-4xl mx-auto">
        {/* Boot Sequence */}
        <div className="w-full max-w-lg">
          <TerminalText
            lines={BOOT_SEQUENCE}
            typingSpeed={15}
            onComplete={() => setBootComplete(true)}
            className="text-xs sm:text-sm"
          />
        </div>

        {/* Logo reveal */}
        <AnimatePresence>
          {bootComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col items-center gap-6"
            >
              <AsciiLogo size="lg" />

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="font-terminal text-null-muted text-xs sm:text-sm tracking-widest uppercase text-center"
              >
                Your thoughts. Your servers. Your rules.
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="flex flex-col sm:flex-row items-center gap-3 mt-2"
              >
                <Link
                  href="/setup"
                  className="group inline-flex items-center gap-2 px-6 py-3 bg-null-green/10 text-null-green border border-null-green/30 rounded font-terminal text-sm hover:bg-null-green/20 hover:border-null-green/50 transition-all duration-300 border-glow-green"
                >
                  Get Started
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 text-null-muted font-terminal text-sm hover:text-null-cyan transition-colors"
                >
                  Sign in
                </Link>
              </motion.div>

              {/* Scroll indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="mt-12 flex flex-col items-center gap-2"
              >
                <span className="font-terminal text-null-dim text-xs uppercase tracking-wider">
                  ↓ scroll to decrypt ↓
                </span>
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-px h-8 bg-gradient-to-b from-null-green/50 to-transparent"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-null-black to-transparent z-10" />
    </section>
  )
}
