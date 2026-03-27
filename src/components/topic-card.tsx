import Link from "next/link";
import { strings } from "@/lib/strings";

interface TopicCardProps {
  icon: string;
  title: string;
  question: string;
  href: string;
}

export function TopicCard({ icon, title, question, href }: TopicCardProps) {
  return (
    <Link
      href={href}
      className="glass-card rounded-xl p-6 hover:border-primary/40 transition-all duration-300 group flex flex-col"
    >
      <span className="text-3xl mb-3">{icon}</span>
      <h3 className="font-headline text-sm md:text-base font-bold mb-2">
        {title}
      </h3>
      <p className="text-on-surface-variant text-xs md:text-sm italic leading-relaxed mb-4 flex-1">
        &ldquo;{question}&rdquo;
      </p>
      <span className="text-primary font-headline font-bold text-xs group-hover:gap-3 flex items-center gap-1.5 transition-all duration-300">
        {strings.explore}
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </span>
    </Link>
  );
}
