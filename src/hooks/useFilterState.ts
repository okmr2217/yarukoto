"use client";

import { useAllTasks, useCategoryTaskCounts } from "@/hooks";
import { useFilterSearchParams, useDebouncedKeyword } from "@/hooks";
import type { StatusFilter } from "@/lib/filter-types";
import type { Category } from "@/types";
import { type CategoryFilter, resolveCategoryIds } from "@/lib/category-filter";

export function useFilterState(
  categories: Category[],
  categoryFilter: CategoryFilter,
  onCategoryFilterChange?: (filter: CategoryFilter) => void,
) {
  const { dateFilter, keyword, statusFilter, favoriteFilter, updateSearchParams, today } = useFilterSearchParams();

  const { localKeyword, isComposingRef, handleKeywordChange, handleCompositionEnd, handleKeywordClear } = useDebouncedKeyword(
    keyword,
    updateSearchParams,
  );

  const taskCategoryIds = resolveCategoryIds(categoryFilter, categories);

  // カテゴリ別・グループ別カウント用（カテゴリフィルター以外を適用した状態）
  const { data: categoryCounts } = useCategoryTaskCounts({
    date: dateFilter || undefined,
    keyword: keyword || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    isFavorite: favoriteFilter || undefined,
  });

  const countByCategory = categoryCounts?.byCategoryId ?? {};
  const countByGroup = categoryCounts?.byGroupId ?? {};

  // ステータス別カウント用（カテゴリフィルターを適用した状態）
  const { data: allFilteredTasks } = useAllTasks({
    categoryIds: taskCategoryIds,
    date: dateFilter || undefined,
    keyword: keyword || undefined,
    isFavorite: favoriteFilter || undefined,
  });

  const statusCounts: Record<StatusFilter, number> = (() => {
    if (!allFilteredTasks) return { all: 0, pending: 0, completed: 0, skipped: 0 };
    const pending = allFilteredTasks.filter((t) => t.status === "PENDING").length;
    const completed = allFilteredTasks.filter((t) => t.status === "COMPLETED").length;
    const skipped = allFilteredTasks.filter((t) => t.status === "SKIPPED").length;
    return { all: allFilteredTasks.length, pending, completed, skipped };
  })();

  const hasActiveFilters = !!(dateFilter || keyword || statusFilter !== "pending" || favoriteFilter || categoryFilter.type !== "all");

  const handleClearFilters = () => {
    handleKeywordClear({ status: null, favorite: null, date: null });
    onCategoryFilterChange?.({ type: "all" });
  };

  return {
    // search params
    dateFilter,
    keyword,
    statusFilter,
    favoriteFilter,
    today,
    updateSearchParams,
    // keyword input
    localKeyword,
    isComposingRef,
    handleKeywordChange,
    handleCompositionEnd,
    handleKeywordClear,
    // task data
    allFilteredTasks,
    countByCategory,
    countByGroup,
    statusCounts,
    // helpers
    hasActiveFilters,
    handleClearFilters,
  };
}
