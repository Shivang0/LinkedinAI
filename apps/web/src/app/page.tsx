import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { PricingSection } from "@/components/pricing-section";
import { Footer } from "@/components/footer";
import { ParallaxBg } from "@/components/parallax-bg";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1a1c2c] relative">
      <ParallaxBg />
      <div className="relative z-10">
        <Header />
        <main>
          <HeroSection />
          <FeaturesSection />
          <PricingSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}
