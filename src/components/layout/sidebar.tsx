"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListTodo, Tags, Settings, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { NAV_ITEMS } from "@/lib/constants";
import { useAllTasks } from "@/hooks";

const iconMap = {
  ListTodo,
  Calendar,
  Tags,
  Settings,
} as const;

export function Sidebar() {
  const pathname = usePathname();
  const { data: pendingTasks } = useAllTasks({ status: "pending" });
  const pendingCount = pendingTasks?.length ?? 0;

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex md:w-64 flex-col sticky top-0 h-screen border-r overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center h-14 px-4 shrink-0">
        <Link href="/" className="flex items-center gap-0.5">
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
      <nav className="px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          if (!Icon) return null;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0 translate-y-px" />
              <span>{item.label}</span>
              {item.href === "/" && pendingCount > 0 && (
                <span className="ml-auto text-[11px] font-medium bg-primary/15 text-primary px-1.5 py-px rounded-full">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
