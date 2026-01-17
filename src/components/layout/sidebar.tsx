"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Tags, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navItems = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/search", label: "検索", icon: Search },
  { href: "/categories", label: "カテゴリ管理", icon: Tags },
  { href: "/settings", label: "設定", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname.startsWith("/date/");
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex md:w-60 lg:w-72 flex-col border-r bg-card sticky top-0 h-screen">
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
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
