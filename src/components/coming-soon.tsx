import Link from "next/link";
import { strings } from "@/lib/strings";

export function ComingSoon({ moduleName }: { moduleName: string }) {
  return (
    <div className="min-h-screen pt-24 pb-20 flex flex-col items-center justify-center text-center px-6">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/[0.06] blur-[100px]" />
      </div>

      <span className="font-label text-primary tracking-[0.3em] text-xs uppercase mb-4 font-medium">
        {moduleName}
      </span>
      <h1 className="font-headline text-4xl md:text-5xl font-extrabold mb-4">
        {strings.comingSoon}
      </h1>
      <p className="text-on-surface-variant text-lg mb-8 max-w-md">
        {strings.comingSoonSubtitle}
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 text-primary font-headline font-bold text-sm hover:opacity-70 transition-opacity"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        {strings.backToHome}
      </Link>
    </div>
  );
}
