import Link from "next/link";
import { strings } from "@/lib/strings";

export function Footer() {
  return (
    <footer className="bg-surface-container-low w-full py-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-6 md:flex-row md:justify-between md:items-start">
        {/* Left */}
        <div>
          <p className="font-headline font-bold text-on-surface text-base mb-2">
            {strings.siteTitle}
          </p>
          <p className="font-label text-on-surface-variant text-xs">
            {strings.footerCopyright}
          </p>
          <p className="font-label text-on-surface-variant text-xs mt-1">
            {strings.footerProf}
          </p>
        </div>

        {/* Right */}
        <div className="md:text-right">
          <Link
            href="/contato"
            className="font-label text-primary text-sm font-semibold underline underline-offset-4 hover:opacity-70 transition-opacity"
          >
            {strings.footerContact}
          </Link>
        </div>
      </div>
    </footer>
  );
}
