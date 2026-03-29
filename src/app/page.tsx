import { HeroSection } from "@/components/HeroSection";
import { ModuleCards } from "@/components/module-cards";

export default function HomePage() {
  return (
    <main className="mesh-bg pt-20">
      <HeroSection />
      <ModuleCards />
    </main>
  );
}
