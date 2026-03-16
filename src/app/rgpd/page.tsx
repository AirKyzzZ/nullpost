import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "RGPD — NullPost",
  description: "Politique de confidentialité et conformité RGPD de NullPost.",
}

export default function RGPDPage() {
  return (
    <main className="min-h-screen bg-null-black py-16 px-6">
      <div className="max-w-2xl mx-auto space-y-10">
        {/* Titre */}
        <div className="space-y-2">
          <h1 className="font-terminal text-null-green text-2xl glow-green">
            {">"} RGPD & Privacy
          </h1>
          <p className="text-sm text-null-muted font-terminal">
            Politique de confidentialité — NullPost
          </p>
        </div>

        {/* Responsable */}
        <section className="space-y-3">
          <h2 className="font-terminal text-null-cyan text-sm uppercase tracking-wider">
            Responsable du traitement
          </h2>
          <p className="text-sm text-null-text leading-relaxed">
            NullPost est un projet open source auto-hébergé. Le responsable du traitement
            est l&apos;administrateur de l&apos;instance qui déploie et opère le service.
          </p>
        </section>

        {/* Données collectées */}
        <section className="space-y-3">
          <h2 className="font-terminal text-null-cyan text-sm uppercase tracking-wider">
            Données collectées
          </h2>
          <div className="border border-null-border rounded bg-null-surface/50 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-null-muted font-terminal">Identifiant GitHub</span>
              <span className="text-null-text">ID + login + email</span>
            </div>
            <hr className="terminal-divider" />
            <div className="flex justify-between text-sm">
              <span className="text-null-muted font-terminal">Posts</span>
              <span className="text-null-green font-terminal">Chiffrés AES-256-GCM</span>
            </div>
            <hr className="terminal-divider" />
            <div className="flex justify-between text-sm">
              <span className="text-null-muted font-terminal">Session</span>
              <span className="text-null-text">JWT httpOnly (Auth.js)</span>
            </div>
            <hr className="terminal-divider" />
            <div className="flex justify-between text-sm">
              <span className="text-null-muted font-terminal">Tracking</span>
              <span className="text-null-green font-terminal">Aucun</span>
            </div>
          </div>
        </section>

        {/* Chiffrement */}
        <section className="space-y-3">
          <h2 className="font-terminal text-null-cyan text-sm uppercase tracking-wider">
            Chiffrement côté client
          </h2>
          <p className="text-sm text-null-text leading-relaxed">
            Tous les posts privés sont chiffrés <strong>côté client</strong> avec AES-256-GCM
            avant d&apos;être envoyés au serveur. La clé de chiffrement est dérivée de votre
            passphrase via PBKDF2 (600 000 itérations, SHA-256). Le serveur ne voit{" "}
            <span className="text-null-red font-terminal">jamais</span> vos données en clair
            ni votre passphrase.
          </p>
        </section>

        {/* Base légale */}
        <section className="space-y-3">
          <h2 className="font-terminal text-null-cyan text-sm uppercase tracking-wider">
            Base légale
          </h2>
          <p className="text-sm text-null-text leading-relaxed">
            Le traitement est fondé sur le <strong>consentement</strong> de l&apos;utilisateur
            (article 6.1.a du RGPD). En vous connectant via GitHub OAuth, vous consentez
            au traitement de votre identifiant GitHub pour le fonctionnement du service.
          </p>
        </section>

        {/* Hébergement */}
        <section className="space-y-3">
          <h2 className="font-terminal text-null-cyan text-sm uppercase tracking-wider">
            Hébergement & sous-traitants
          </h2>
          <p className="text-sm text-null-text leading-relaxed">
            L&apos;instance peut être auto-hébergée (Docker + SQLite) ou déployée sur des
            plateformes cloud (Vercel, Netlify). L&apos;authentification OAuth passe par
            les serveurs de GitHub (Microsoft). Aucun autre sous-traitant n&apos;est utilisé.
            Aucune donnée n&apos;est partagée avec des tiers.
          </p>
        </section>

        {/* Droits */}
        <section className="space-y-3">
          <h2 className="font-terminal text-null-cyan text-sm uppercase tracking-wider">
            Vos droits
          </h2>
          <div className="border border-null-border rounded bg-null-surface/50 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-null-muted font-terminal">Accès</span>
              <span className="text-null-text">Visible dans l&apos;application</span>
            </div>
            <hr className="terminal-divider" />
            <div className="flex justify-between text-sm">
              <span className="text-null-muted font-terminal">Export</span>
              <span className="text-null-text">JSON via Settings</span>
            </div>
            <hr className="terminal-divider" />
            <div className="flex justify-between text-sm">
              <span className="text-null-muted font-terminal">Suppression</span>
              <span className="text-null-text">Contactez l&apos;administrateur</span>
            </div>
          </div>
          <p className="text-xs text-null-dim">
            Pour exercer vos droits, contactez l&apos;administrateur de l&apos;instance.
          </p>
        </section>

        {/* Cookies */}
        <section className="space-y-3">
          <h2 className="font-terminal text-null-cyan text-sm uppercase tracking-wider">
            Cookies
          </h2>
          <p className="text-sm text-null-text leading-relaxed">
            NullPost utilise uniquement un cookie de session httpOnly géré par Auth.js.
            Ce cookie est strictement nécessaire au fonctionnement de l&apos;authentification.
            Aucun cookie de tracking, d&apos;analytics ou publicitaire n&apos;est utilisé.
          </p>
        </section>

        {/* Footer */}
        <div className="pt-6 border-t border-null-border">
          <p className="text-xs text-null-dim font-terminal text-center">
            {">"} Dernière mise à jour : mars 2026
          </p>
        </div>
      </div>
    </main>
  )
}
