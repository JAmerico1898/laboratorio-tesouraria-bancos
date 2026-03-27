import Link from "next/link";

interface ExerciseCTAProps {
  title: string;
  description: string;
  href: string;
}

export function ExerciseCTA({ title, description, href }: ExerciseCTAProps) {
  return (
    <Link
      href={href}
      className="block rounded-xl p-5 md:p-6 text-center bg-gradient-to-r from-primary to-primary-container hover:opacity-90 transition-opacity duration-300"
    >
      <h3 className="font-headline text-on-primary-container text-base md:text-lg font-extrabold">
        {title}
      </h3>
      <p className="text-on-primary-container/80 text-xs md:text-sm mt-1">
        {description}
      </p>
    </Link>
  );
}
