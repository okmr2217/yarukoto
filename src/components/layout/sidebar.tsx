"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ListTodo, Tags, Settings, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { NAV_ITEMS, CATEGORY_DESELECTED_SENTINEL } from "@/lib/constants";
import { useAllTasks, useCategories } from "@/hooks";
import { SearchColumn } from "./search-column";

const iconMap = {
  ListTodo,
  Calendar,
  Tags,
  Settings,
} as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: pendingTasks } = useAllTasks({ status: "pending" });
  const pendingCount = pendingTasks?.length ?? 0;
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
      <nav className="px-3 py-3 space-y-1 shrink-0">
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
