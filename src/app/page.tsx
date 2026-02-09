import { HeroSection } from "@/components/landing/hero-section"
import { ProblemSection } from "@/components/landing/problem-section"
import { PhilosophySection } from "@/components/landing/philosophy-section"
import { InspirationSection } from "@/components/landing/inspiration-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { DeploySection } from "@/components/landing/deploy-section"
import { FooterSection } from "@/components/landing/footer-section"

export default function Home() {
  return (
    <main className="relative">
      <HeroSection />
      <ProblemSection />
      <PhilosophySection />
      <InspirationSection />
      <FeaturesSection />
      <DeploySection />
      <FooterSection />
    </main>
  )
}
