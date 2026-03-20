"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tags, Settings, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { NAV_ITEMS, NAV_GROUPS } from "@/lib/constants";

const iconMap = {
  Home,
  Calendar,
  Tags,
  Settings,
} as const;

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex md:w-64 flex-col border-r bg-card sticky top-0 h-screen">
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icons/icon-192x192.png"
            alt="icon"
            width={32}
            height={32}
          />
          <span className="text-xl font-medium font-logo">Yarukoto</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((item) => item.group === group.key);
          return (
            <div key={group.key}>
              <p className="px-2 mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = iconMap[item.icon as keyof typeof iconMap];
                  if (!Icon) return null;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0 translate-y-px" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
