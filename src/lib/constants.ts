export const SITE_CONFIG = {
  name: "NullPost",
  tagline: "Your thoughts. Your servers. Your rules.",
  description:
    "A private, encrypted, self-hosted micro-blogging platform. Open source. No tracking. No algorithms. Your words belong to you.",
  url: "https://nullpost.maximemansiet.fr",
  github: "https://github.com/AirKyzzZ/nullpost",
  author: "Maxime Mansiet",
  authorUrl: "https://maximemansiet.fr",
} as const

export const BOOT_SEQUENCE = [
  { text: "> Establishing secure connection...", delay: 0 },
  { text: "> Loading encryption modules...", delay: 400 },
  { text: "> Verifying integrity...", delay: 800 },
  { text: "> Decrypting channel...", delay: 1200 },
  { text: "> System ready.", delay: 1800 },
] as const

export const APP_CONFIG = {
  sessionDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
  sessionCookie: "nullpost_session",
  maxPasswordLength: 128,
  minPasswordLength: 8,
  minPassphraseLength: 8,
} as const
