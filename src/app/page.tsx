import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Showcase from "@/components/landing/Showcase";
import HowItWorks from "@/components/landing/HowItWorks";
import Reviews from "@/components/landing/Reviews";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import LandingEffects from "@/components/landing/LandingEffects";

export default function Home() {
  return (
    <main style={{ overflowX: "hidden" }}>
      <Nav />
      <Hero />
      <Features />
      <Showcase />
      <HowItWorks />
      <Reviews />
      <CTA />
      <Footer />
      {/* Client-only: scroll-reveal, hover-tilt, hero parallax, magnetic buttons */}
      <LandingEffects />
    </main>
  );
}
