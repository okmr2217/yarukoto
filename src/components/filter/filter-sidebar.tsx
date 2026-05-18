"use client";

import type { Category } from "@/types";
import type { CategoryFilter } from "@/lib/category-filter";
import type { SortOrder } from "@/lib/filter-types";
import { useFilterState } from "@/hooks/useFilterState";
import { StatusSection, DateSection, CategorySection, KeywordSection, FavoriteSection, SortSection } from "./filter-sections";

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

  return (
    <aside className="hidden md:flex flex-col w-75 shrink-0 sticky top-12 h-[calc(100vh-3rem)] overflow-hidden">
      {/* 上部: スクロールしない固定セクション群 */}
      <div className="shrink-0 flex flex-col gap-3 px-4 pt-3 pb-2">
        <StatusSection state={state} />
        <DateSection state={state} />
        <KeywordSection state={state} />
        <FavoriteSection state={state} />
        <CategorySection
          categories={categories}
          categoriesLoading={categoriesLoading}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
          countByCategory={state.countByCategory}
          countByGroup={state.countByGroup}
        />
        <div className="border-t border-border/50" />
        <SortSection sort={sort} onSortChange={onSortChange} />
      </div>
    </aside>
  );
}
