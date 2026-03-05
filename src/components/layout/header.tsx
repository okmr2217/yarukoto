"use client";

import { useState } from "react";
import { Menu, Search, Settings, Tags, Home, Calendar } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, NAV_GROUPS } from "@/lib/constants";

const iconMap = {
  Home,
  Calendar,
  Search,
  Tags,
  Settings,
} as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b md:hidden">
      <div className="flex items-center justify-between h-14 px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="メニューを開く">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-primary font-logo">
                Yarukoto
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-4 space-y-4 px-2">
              {NAV_GROUPS.map((group) => {
                const items = NAV_ITEMS.filter(
                  (item) => item.group === group.key,
                );
                return (
                  <div key={group.key}>
                    <p className="px-2 mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                      {group.label}
                    </p>
                    <div className="space-y-0.5">
                      {items.map((item) => {
                        const Icon = iconMap[item.icon];
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                              active
                                ? "bg-primary text-primary-foreground font-medium"
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
          </SheetContent>
        </Sheet>

        <div className="flex items-center">
          <Image
            src={"/icons/icon-192x192.png"}
            alt="icon"
            width={32}
            height={32}
          />
          <h1 className="text-xl font-medium font-logo">Yarukoto</h1>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/search" aria-label="検索">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings" aria-label="設定">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
