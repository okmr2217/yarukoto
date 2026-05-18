"use client";

import type { Category } from "@/types";
import type { CategoryFilter } from "@/lib/category-filter";
import type { ViewMode, ListSortOrder, ScheduledSortOrder } from "@/lib/filter-types";
import { useFilterState } from "@/hooks/useFilterState";
import { StatusSection, ViewSection, DateSection, CategorySection, KeywordSection, FavoriteSection, SortSection } from "./filter-sections";

export type { ViewMode, ListSortOrder, ScheduledSortOrder };

interface FilterSidebarProps {
  categories: Category[];
  categoriesLoading: boolean;
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (filter: CategoryFilter) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  listSort: ListSortOrder;
  onListSortChange: (sort: ListSortOrder) => void;
  scheduledSort: ScheduledSortOrder;
  onScheduledSortChange: (sort: ScheduledSortOrder) => void;
}

export function FilterSidebar({
  categories,
  categoriesLoading,
  categoryFilter,
  onCategoryFilterChange,
  viewMode,
  onViewModeChange,
  listSort,
  onListSortChange,
  scheduledSort,
  onScheduledSortChange,
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
        <ViewSection viewMode={viewMode} onViewModeChange={onViewModeChange} />
        <SortSection
          viewMode={viewMode}
          listSort={listSort}
          onListSortChange={onListSortChange}
          scheduledSort={scheduledSort}
          onScheduledSortChange={onScheduledSortChange}
        />
      </div>
    </aside>
  );
}
