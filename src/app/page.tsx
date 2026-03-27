import { Hero } from "@/components/hero";
import { ModuleCards } from "@/components/module-cards";

export default function HomePage() {
  return (
    <main className="mesh-bg pt-20">
      <Hero />
      <ModuleCards />
    </main>
  );
}
