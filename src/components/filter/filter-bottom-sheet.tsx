"use client";

import type { Category } from "@/types";
import type { CategoryFilter } from "@/lib/category-filter";
import type { SortOrder } from "@/lib/filter-types";
import { useFilterState } from "@/hooks/useFilterState";
import { StatusSection, DateSection, CategorySection, FavoriteSection, SortSection } from "./filter-sections";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";

interface FilterBottomSheetProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  categoriesLoading: boolean;
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (filter: CategoryFilter) => void;
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
}

export function FilterBottomSheet({
  open,
  onClose,
  categories,
  categoriesLoading,
  categoryFilter,
  onCategoryFilterChange,
  sort,
  onSortChange,
}: FilterBottomSheetProps) {
  const state = useFilterState(categories, categoryFilter, onCategoryFilterChange);

  return (
    <ResponsiveDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>絞り込み</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="overflow-y-auto">
          <div className="flex flex-col gap-4 pb-4">
            <StatusSection state={state} />
            <DateSection state={state} />
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
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <button
            type="button"
            onClick={state.handleClearFilters}
            disabled={!state.hasActiveFilters}
            className="w-full h-9 rounded-md border border-border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-accent"
          >
            クリア
          </button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
