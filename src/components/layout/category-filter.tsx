"use client";

import type { Category } from "@/types";
import { CategoryChip } from "./category-chip";
import { useAllTasks } from "@/hooks";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryIds: string[];
  onToggleCategory: (categoryId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isLoading?: boolean;
}

export function CategoryFilter({ categories, selectedCategoryIds, onToggleCategory, onSelectAll, onDeselectAll, isLoading }: CategoryFilterProps) {
  const noneSelected = selectedCategoryIds.length === 0;
  const allSelected =
    !isLoading &&
    categories.length > 0 &&
    categories.every((c) => selectedCategoryIds.includes(c.id)) &&
    selectedCategoryIds.includes("none");

  const { data: allPendingTasks } = useAllTasks({ status: "pending" });

  const pendingCountByCategory = (() => {
    if (!allPendingTasks) return {} as Record<string, number>;
    const counts: Record<string, number> = {};
    for (const task of allPendingTasks) {
      const key = task.categoryId ?? "none";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  })();

  return (
    <div className="bg-background border-b">
      <div className="flex flex-wrap items-center gap-1 px-3 py-1.5">
        <button
          onClick={onDeselectAll}
          className={cn(
            "text-xs px-2.5 py-1.5 rounded whitespace-nowrap transition-all shrink-0",
            noneSelected ? "bg-muted text-foreground font-semibold" : "bg-muted/50 text-muted-foreground hover:bg-muted/70",
          )}
        >
          全て解除
        </button>
        <button
          onClick={onSelectAll}
          className={cn(
            "text-xs px-2.5 py-1.5 rounded whitespace-nowrap transition-all shrink-0",
            allSelected ? "bg-muted text-foreground font-semibold" : "bg-muted/50 text-muted-foreground hover:bg-muted/70",
          )}
        >
          全て選択
        </button>
        <div className="w-px h-4 bg-border shrink-0" />
        {isLoading
          ? [48, 72, 56, 40].map((w, i) => (
              <div key={i} className="h-7 rounded-full bg-muted animate-pulse shrink-0" style={{ width: `${w}px` }} />
            ))
          : (
            <>
              {categories.map((category) => (
                <CategoryChip
                  key={category.id}
                  label={category.name}
                  color={category.color}
                  active={selectedCategoryIds.includes(category.id)}
                  onClick={() => onToggleCategory(category.id)}
                  count={pendingCountByCategory[category.id]}
                />
              ))}
              <CategoryChip
                label="カテゴリなし"
                active={selectedCategoryIds.includes("none")}
                onClick={() => onToggleCategory("none")}
                isSpecial
                count={pendingCountByCategory["none"]}
              />
            </>
          )}
      </div>
    </div>
  );
}
