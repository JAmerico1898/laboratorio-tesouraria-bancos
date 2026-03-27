"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  label: string;
  href: string;
  icon?: string;
}

interface ModuleTabBarProps {
  tabs: Tab[];
}

export function ModuleTabBar({ tabs }: ModuleTabBarProps) {
  const pathname = usePathname();

  return (
    <div className="sticky top-[57px] z-40 bg-surface-container-low border-b border-outline-variant/30 overflow-x-auto">
      <div className="max-w-7xl mx-auto flex gap-0 px-6">
        {tabs.map((tab) => {
          const isActive =
            tab.href === pathname ||
            (tab.href !== tabs[0].href && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap px-4 py-3 text-xs font-label font-medium tracking-wide transition-colors duration-200 border-b-2 ${
                isActive
                  ? "text-primary border-primary"
                  : "text-on-surface-variant border-transparent hover:text-on-surface hover:border-outline-variant/50"
              }`}
            >
              {tab.icon ? `${tab.icon} ${tab.label}` : tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
