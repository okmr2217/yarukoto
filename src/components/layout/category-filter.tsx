"use client";

import type { Category } from "@/types";
import { CategoryChip } from "./category-chip";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryIds: string[];
  onToggleCategory: (categoryId: string | null) => void;
  isLoading?: boolean;
}

export function CategoryFilter({ categories, selectedCategoryIds, onToggleCategory, isLoading }: CategoryFilterProps) {
  return (
    <div className="bg-background border-b">
      <div
        className="flex items-center gap-2 px-4 py-2 overflow-x-auto"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
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
                className="h-7 rounded-full bg-muted animate-pulse shrink-0"
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
  );
}
