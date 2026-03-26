"use client";

import { cn } from "@/lib/utils";
import type { Category } from "@/types";
import { CategoryFilter } from "./category-filter";
import { FilterPanel, type FilterValues } from "./filter-panel";
import { useFilterPanel } from "./filter-panel-context";

interface FilterAreaProps {
  categories: Category[];
  selectedCategoryIds: string[];
  onToggleCategory: (categoryId: string | null) => void;
  categoriesLoading: boolean;
  filterValues: FilterValues;
  hasActiveFilters: boolean;
  onFilterChange: <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => void;
  onClearFilters: () => void;
}

export function FilterArea({
  categories,
  selectedCategoryIds,
  onToggleCategory,
  categoriesLoading,
  filterValues,
  hasActiveFilters,
  onFilterChange,
  onClearFilters,
}: FilterAreaProps) {
  const { filterPanelOpen, toggleFilterPanel } = useFilterPanel();

  return (
    <div className="sticky top-14 md:top-0 z-40">
      <CategoryFilter
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
        onToggleCategory={onToggleCategory}
        onFilterToggle={toggleFilterPanel}
        isFilterOpen={filterPanelOpen}
        hasActiveFilters={hasActiveFilters}
        isLoading={categoriesLoading}
      />
      {/* モバイルのみ表示（PC はサイドバーに表示） */}
      <div className={cn("max-w-2xl w-full mx-auto md:hidden", !filterPanelOpen && "hidden")}>
        <FilterPanel
          values={filterValues}
          onChange={onFilterChange}
          onClear={onClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>
    </div>
  );
}
