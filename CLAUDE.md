# NullPost

Private, encrypted, self-hosted micro-blogging platform with Watch Dogs terminal aesthetic.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Fonts:** JetBrains Mono (UI/terminal) + Inter (body text)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                # Reusable UI primitives (GlitchText, MatrixRain, etc.)
│   ├── landing/           # Landing page sections
│   └── features/          # App feature components (future)
├── lib/                   # Utilities, constants, configs
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript definitions
└── styles/                # Additional styles if needed
```

## Design System

### Colors (defined in globals.css @theme)

- `null-black` (#0a0a0a) — background
- `null-surface` (#111111) — cards/panels
- `null-border` (#1a1a1a) — borders
- `null-green` (#00ff41) — primary/active (matrix green)
- `null-cyan` (#00d4ff) — secondary/links
- `null-purple` (#8b5cf6) — accent/tags
- `null-red` (#ff0040) — danger/alerts
- `null-muted` (#555555) — metadata
- `null-text` (#e0e0e0) — body text
- `null-dim` (#333333) — subtle elements

### Typography

- Monospace (JetBrains Mono): UI chrome, headings, labels, terminal elements
- Sans-serif (Inter): Body text, long-form content

### Animation Components

- `MatrixRain` — Canvas-based falling characters background
- `GlitchText` — Text with decode/glitch effects on hover
- `TerminalText` — Typing animation line by line
- `ScrollReveal` — Framer Motion scroll-triggered reveal
- `AsciiLogo` — ASCII art logo (sm/md/lg sizes)

## Conventions

- Named exports only (no default exports except pages)
- `cn()` utility for className merging (clsx + tailwind-merge)
- Client components marked with `"use client"` directive
- Server components by default for data fetching
- CSS classes use `font-terminal` for monospace UI elements
- Glow effects via `.glow-green`, `.glow-cyan` CSS classes

## Hosting

- **Domain:** nullpost.maximemansiet.fr
- **Platform:** Vercel (free tier)
- **Self-host:** Docker (SQLite + local filesystem)
