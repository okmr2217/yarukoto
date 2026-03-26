"use client";

import { SlidersHorizontal } from "lucide-react";
import type { Category } from "@/types";
import { CategoryChip } from "./category-chip";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryIds: string[];
  onToggleCategory: (categoryId: string | null) => void;
  /** フィルタパネル開閉トグル */
  onFilterToggle?: () => void;
  /** フィルタパネルが開いているか */
  isFilterOpen?: boolean;
  /** アクティブなフィルタが存在するか */
  hasActiveFilters?: boolean;
  /** カテゴリ読み込み中か */
  isLoading?: boolean;
}

export function CategoryFilter({
  categories,
  selectedCategoryIds,
  onToggleCategory,
  onFilterToggle,
  isFilterOpen,
  hasActiveFilters,
  isLoading,
}: CategoryFilterProps) {
  return (
    <div className="bg-background border-b">
      <div className="flex items-center max-w-2xl mx-auto">
        {/* 折り返し表示のカテゴリチップ */}
        <div className="flex-1 px-4 py-2">
          <div className="flex flex-wrap gap-2">
            <CategoryChip
              label="すべて"
              active={selectedCategoryIds.length === 0}
              onClick={() => onToggleCategory(null)}
              isSpecial
            />
            {isLoading
              ? [48, 72, 56, 40].map((w, i) => (
                  <div
                    key={i}
                    className="h-7 rounded-full bg-muted animate-pulse flex-shrink-0"
                    style={{ width: `${w}px` }}
                  />
                ))
              : categories.map((category) => (
                  <CategoryChip
                    key={category.id}
                    label={category.name}
                    color={category.color}
                    active={selectedCategoryIds.includes(category.id)}
                    onClick={() => onToggleCategory(category.id)}
                  />
                ))}
            <CategoryChip
              label="カテゴリなし"
              active={selectedCategoryIds.includes("none")}
              onClick={() => onToggleCategory("none")}
              isSpecial
            />
          </div>
        </div>

        {/* フィルタトグルボタン */}
        {onFilterToggle && (
          <div className="px-2 shrink-0 border-l self-stretch flex items-center">
            <button
              onClick={onFilterToggle}
              aria-label="フィルターを開く"
              aria-pressed={isFilterOpen}
              className={cn(
                "relative p-1.5 rounded transition-colors",
                isFilterOpen
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
