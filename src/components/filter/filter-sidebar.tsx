"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";
import type { CategoryFilter } from "@/lib/category-filter";
import type { SortOrder } from "@/lib/filter-types";
import { useFilterState } from "@/hooks/useFilterState";
import { StatusSection, KeywordSection, CategorySection } from "./filter-sections";
import { FilterDetailDialog } from "./filter-detail-dialog";

export type { SortOrder };

interface FilterSidebarProps {
  categories: Category[];
  categoriesLoading: boolean;
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (filter: CategoryFilter) => void;
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
}

export function FilterSidebar({
  categories,
  categoriesLoading,
  categoryFilter,
  onCategoryFilterChange,
  sort,
  onSortChange,
}: FilterSidebarProps) {
  const state = useFilterState(categories, categoryFilter, onCategoryFilterChange);
  const [detailOpen, setDetailOpen] = useState(false);

  const detailActiveCount = [!!state.dateFilter, state.favoriteFilter].filter(Boolean).length;

  return (
    <aside className="hidden md:flex flex-col w-75 shrink-0 sticky top-12 h-[calc(100vh-3rem)] overflow-hidden">
      <div className="shrink-0 flex flex-col gap-3 px-4 pt-3 pb-2">
        <StatusSection state={state} />
        <KeywordSection state={state} />
        <CategorySection
          categories={categories}
          categoriesLoading={categoriesLoading}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
          countByCategory={state.countByCategory}
          countByGroup={state.countByGroup}
        />
        <div className="border-t border-border/50" />
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className={cn(
            "flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors self-start",
            detailActiveCount > 0 && "text-primary hover:text-primary/80",
          )}
        >
          <SlidersHorizontal className="size-3" />
          詳細フィルター
          {detailActiveCount > 0 && (
            <span className="min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
              {detailActiveCount}
            </span>
          )}
        </button>
      </div>

      <FilterDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        state={state}
        sort={sort}
        onSortChange={onSortChange}
      />
    </aside>
  );
}
