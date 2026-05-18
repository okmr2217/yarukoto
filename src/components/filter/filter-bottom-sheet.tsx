"use client";

import { X } from "lucide-react";
import type { Category } from "@/types";
import type { CategoryFilter } from "@/lib/category-filter";
import type { ViewMode, ListSortOrder, ScheduledSortOrder } from "@/lib/filter-types";
import { useFilterState } from "@/hooks/useFilterState";
import { StatusSection, ViewSection, DateSection, CategorySection, KeywordSection, FavoriteSection, SortSection } from "./filter-sections";
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
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  listSort: ListSortOrder;
  onListSortChange: (sort: ListSortOrder) => void;
  scheduledSort: ScheduledSortOrder;
  onScheduledSortChange: (sort: ScheduledSortOrder) => void;
}

export function FilterBottomSheet({
  open,
  onClose,
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
}: FilterBottomSheetProps) {
  const state = useFilterState(categories, categoryFilter, onCategoryFilterChange);

  return (
    <ResponsiveDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <div className="flex items-center justify-between">
            <ResponsiveDialogTitle>絞り込み</ResponsiveDialogTitle>
            {state.hasActiveFilters && (
              <button
                type="button"
                onClick={state.handleClearFilters}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
              >
                <X className="size-3" />
                クリア
              </button>
            )}
          </div>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="overflow-y-auto">
          <div className="flex flex-col gap-4 pb-4">
            <KeywordSection state={state} />
            <StatusSection state={state} />
            <ViewSection viewMode={viewMode} onViewModeChange={onViewModeChange} />
            <DateSection state={state} />
            <CategorySection
              categories={categories}
              categoriesLoading={categoriesLoading}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={onCategoryFilterChange}
              countByCategory={state.countByCategory}
              countByGroup={state.countByGroup}
            />
            <FavoriteSection state={state} />
            <SortSection
              viewMode={viewMode}
              listSort={listSort}
              onListSortChange={onListSortChange}
              scheduledSort={scheduledSort}
              onScheduledSortChange={onScheduledSortChange}
            />
          </div>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            閉じる
          </button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
