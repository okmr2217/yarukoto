"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ListTodo, Tags, Settings, BarChart2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { NAV_ITEMS, CATEGORY_DESELECTED_SENTINEL } from "@/lib/constants";
import { useCategories } from "@/hooks";
import { SearchColumn } from "./search-column";

const iconMap = {
  ListTodo,
  BarChart2,
  Tags,
  Settings,
  HelpCircle,
} as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const categoryParam = searchParams.get("category");
  const isDefaultAllSelected = categoryParam === null;
  const isAllDeselected = categoryParam === CATEGORY_DESELECTED_SENTINEL;
  const effectiveSelectedIds = isDefaultAllSelected
    ? [...categories.map((c) => c.id), "none"]
    : isAllDeselected
    ? []
    : (categoryParam?.split(",") ?? []);

  const updateCategoryParam = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete("category");
    } else {
      params.set("category", value);
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  };

  const handleToggleCategory = (categoryId: string) => {
    const next = effectiveSelectedIds.includes(categoryId)
      ? effectiveSelectedIds.filter((id) => id !== categoryId)
      : [...effectiveSelectedIds, categoryId];

    if (next.length === 0) {
      updateCategoryParam(CATEGORY_DESELECTED_SENTINEL);
    } else {
      const allIds = [...categories.map((c) => c.id), "none"];
      const isAllSelected = allIds.length === next.length && allIds.every((id) => next.includes(id));
      updateCategoryParam(isAllSelected ? null : next.join(","));
    }
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex md:w-[300px] flex-col sticky top-0 h-screen overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center h-12 px-4 shrink-0">
        <Link href="/" className="flex items-center gap-0.5">
          <Image
            src="/icons/icon-192x192.png"
            alt="icon"
            width={28}
            height={28}
          />
          <span className="text-lg font-medium font-logo">Yarukoto</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="px-2 py-2 space-y-0.5 shrink-0">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          if (!Icon) return null;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-all duration-150",
                active
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* タスク一覧ページのみ絞り込みパネルを表示 */}
      {pathname === "/" && (
        <SearchColumn
          categories={categories}
          categoriesLoading={categoriesLoading}
          selectedCategoryIds={effectiveSelectedIds}
          onToggleCategory={handleToggleCategory}
        />
      )}
    </aside>
  );
}
