"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";
import { CategoryFilter } from "./category-filter";
import { FilterPanel, type FilterValues } from "./filter-panel";

interface FilterAreaProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  categoriesLoading: boolean;
  filterValues: FilterValues;
  hasActiveFilters: boolean;
  onFilterChange: <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => void;
  onClearFilters: () => void;
}

export function FilterArea({
  categories,
  selectedCategoryId,
  onSelectCategory,
  categoriesLoading,
  filterValues,
  hasActiveFilters,
  onFilterChange,
  onClearFilters,
}: FilterAreaProps) {
  const [filterPanelOpen, setFilterPanelOpen] = useState(hasActiveFilters);

  return (
    <>
      <CategoryFilter
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={onSelectCategory}
        onFilterToggle={() => setFilterPanelOpen((v) => !v)}
        isFilterOpen={filterPanelOpen}
        hasActiveFilters={hasActiveFilters}
        isLoading={categoriesLoading}
      />
      <div className={cn("max-w-2xl w-full mx-auto", !filterPanelOpen && "hidden")}>
        <FilterPanel
          values={filterValues}
          onChange={onFilterChange}
          onClear={onClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>
    </>
  );
}
