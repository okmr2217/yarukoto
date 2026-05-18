"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterFab, FilterBottomSheet, FilterSidebar, DueDateAlertChip, type FilterValues } from "@/components/filter";
import { MobileHeader } from "@/components/layout/mobile-header";
import { TaskSection, TaskCreateModal, TaskFab, TaskDetailModal, SkipReasonDialog } from "@/components/task";
import { useAllTasks, useTaskMutations, useCategories, useGroups, useRecentCategories } from "@/hooks";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { parseCategoryParam, categoryFilterToParam, resolveCategoryIds, type CategoryFilter } from "@/lib/category-filter";
import type { Task } from "@/types";
import { formatDateToJST } from "@/lib/dateUtils";
import type { ViewMode, ListSortOrder, ScheduledSortOrder } from "@/lib/filter-types";

function countActiveFilters(values: FilterValues, categoryActive: boolean): number {
  let count = 0;
  if (values.keyword) count++;
  if (values.status !== "pending") count++;
  if (values.date) count++;
  if (values.isFavorite) count++;
  if (categoryActive) count++;
  return count;
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category");
  const categoryFilter = parseCategoryParam(categoryParam);
  const dateFilter = searchParams.get("date") || "";
  const keyword = searchParams.get("keyword") || "";
  const statusFilter = (searchParams.get("status") || "pending") as FilterValues["status"];
  const favoriteFilter = searchParams.get("favorite") === "true";
  const viewMode = (searchParams.get("view") || "list") as ViewMode;
  const [listSort, setListSort] = useState<ListSortOrder>("displayOrder");
  const [prevStatusFilter, setPrevStatusFilter] = useState(statusFilter);
  const [scheduledSort, setScheduledSort] = useState<ScheduledSortOrder>("scheduledAt_asc");

  // 他ページから戻ったとき、直前の検索条件を復元する
  useEffect(() => {
    const stored = sessionStorage.getItem("task-filter-params");
    if (stored && !searchParams.toString()) {
      router.replace(`/?${stored}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const qs = searchParams.toString();
    if (qs) {
      sessionStorage.setItem("task-filter-params", qs);
    } else {
      sessionStorage.removeItem("task-filter-params");
    }
  }, [searchParams]);

  if (prevStatusFilter !== statusFilter) {
    setPrevStatusFilter(statusFilter);
    const derived = statusFilter === "completed" ? "createdAt" : "displayOrder";
    if (listSort !== derived) setListSort(derived);
  }

  const hasActiveFilters = !!(dateFilter || keyword || statusFilter !== "pending" || favoriteFilter || categoryFilter.type !== "all");

  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [skippingTask, setSkippingTask] = useState<Task | null>(null);
  const [taskInputOpen, setTaskInputOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.push(qs ? `/?${qs}` : "/");
    },
    [searchParams, router],
  );

  const filterValues: FilterValues = {
    keyword,
    status: statusFilter,
    isFavorite: favoriteFilter,
    date: dateFilter,
  };

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: groups = [] } = useGroups();
  const { recordRecentCategory } = useRecentCategories();

  const taskCategoryIds = resolveCategoryIds(categoryFilter, categories);

  const handleCategoryFilterChange = useCallback(
    (filter: CategoryFilter) => {
      updateSearchParams({ category: categoryFilterToParam(filter) });
    },
    [updateSearchParams],
  );

  const {
    data: tasks,
    isLoading,
    error,
  } = useAllTasks({
    categoryIds: taskCategoryIds,
    date: dateFilter || undefined,
    keyword: keyword || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    isFavorite: favoriteFilter || undefined,
  });

  const sortedTasks = (() => {
    if (!tasks) return [];
    if (viewMode === "schedule") {
      const sorted = [...tasks];
      if (scheduledSort === "createdAt") {
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      const asc = scheduledSort !== "scheduledAt_desc";
      return sorted.sort((a, b) => {
        if (!a.scheduledAt && !b.scheduledAt) return 0;
        if (!a.scheduledAt) return 1;
        if (!b.scheduledAt) return -1;
        return asc ? a.scheduledAt.localeCompare(b.scheduledAt) : b.scheduledAt.localeCompare(a.scheduledAt);
      });
    }
    if (listSort === "createdAt") {
      return [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return tasks;
  })();

  const mutations = useTaskMutations();

  const handleCreateTask = (data: { title: string; scheduledAt?: string; categoryId?: string; memo?: string }) => {
    if (data.categoryId) recordRecentCategory(data.categoryId);
    mutations.createTask.mutate(data);
  };

  const handleReorder = (taskId: string, beforeTaskId?: string, afterTaskId?: string) => {
    mutations.reorderTasks.mutate({ taskId, beforeTaskId, afterTaskId });
  };

  const detailTask = tasks?.find((t) => t.id === detailTaskId) ?? null;

  const handleComplete = (id: string) => mutations.completeTask.mutate(id);
  const handleUncomplete = (id: string) => mutations.uncompleteTask.mutate(id);
  const handleToggleFavorite = (id: string) => mutations.toggleFavorite.mutate(id);

  const handleSkip = (id: string) => {
    if (!tasks) return;
    const task = tasks.find((t) => t.id === id);
    if (task) setSkippingTask(task);
  };

  const handleSkipConfirm = (reason?: string) => {
    if (skippingTask) {
      mutations.skipTask.mutate({ id: skippingTask.id, reason });
      setSkippingTask(null);
    }
  };

  const handleDelete = (id: string) => setDeletingTaskId(id);

  const handleDeleteConfirm = () => {
    if (deletingTaskId) {
      mutations.deleteTask.mutate(deletingTaskId);
      setDeletingTaskId(null);
    }
  };

  const taskHandlers = {
    onOpenDetail: (task: Task) => setDetailTaskId(task.id),
    onComplete: handleComplete,
    onUncomplete: handleUncomplete,
    onSkip: handleSkip,
    onUnskip: (id: string) => mutations.unskipTask.mutate(id),
    onDelete: handleDelete,
    onToggleFavorite: handleToggleFavorite,
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        setTaskInputOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      if (!/^[0-9]$/.test(e.key)) return;
      if (taskInputOpen) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
      e.preventDefault();

      const categoryId = e.key === "0" ? "none" : categories[parseInt(e.key, 10) - 1]?.id;
      if (!categoryId) return;
      if (categoryFilter.type === "category" && categoryFilter.categoryId === categoryId) {
        handleCategoryFilterChange({ type: "all" });
      } else {
        handleCategoryFilterChange({ type: "category", categoryId });
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [categories, categoryFilter, taskInputOpen, handleCategoryFilterChange]);

  const getMatchReasons = (task: Task): string[] => {
    if (!dateFilter) return [];
    const reasons: string[] = [];
    if (task.scheduledAt === dateFilter) reasons.push("予定日");
    if (task.completedAt && formatDateToJST(new Date(task.completedAt)) === dateFilter) reasons.push("この日に完了");
    if (task.skippedAt && formatDateToJST(new Date(task.skippedAt)) === dateFilter) reasons.push("この日にやらない");
    if (formatDateToJST(new Date(task.createdAt)) === dateFilter && task.scheduledAt !== dateFilter) reasons.push("この日に作成");
    return reasons;
  };

  const defaultCategoryId =
    categoryFilter.type === "category" && categoryFilter.categoryId !== "none" ? categoryFilter.categoryId : undefined;

  const sidebarProps = {
    categories,
    categoriesLoading,
    categoryFilter,
    onCategoryFilterChange: handleCategoryFilterChange,
    viewMode,
    onViewModeChange: (mode: ViewMode) => updateSearchParams({ view: mode === "list" ? null : mode }),
    listSort,
    onListSortChange: setListSort,
    scheduledSort,
    onScheduledSortChange: setScheduledSort,
  };

  const bottomSheetProps = {
    open: filterSheetOpen,
    onClose: () => setFilterSheetOpen(false),
    categories,
    categoriesLoading,
    categoryFilter,
    onCategoryFilterChange: handleCategoryFilterChange,
    viewMode,
    onViewModeChange: (mode: ViewMode) => updateSearchParams({ view: mode === "list" ? null : mode }),
    listSort,
    onListSortChange: setListSort,
    scheduledSort,
    onScheduledSortChange: setScheduledSort,
  };

  return (
    <div className="flex-1 bg-background flex flex-col">
      <div className="flex flex-1 min-h-0">
        <FilterSidebar {...sidebarProps} />
        <div className="flex-1 flex flex-col min-w-0">
          <MobileHeader title="タスク" actions={<DueDateAlertChip />} />
          <main className="flex-1">
            <div className="px-4 pt-2 pb-20 md:pb-4">
              {isLoading ? (
                <div className="rounded-lg border border-border overflow-hidden bg-card">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i}>
                      {i > 0 && <div className="border-t border-border" />}
                      <div className="flex p-3 gap-3">
                        <div className="h-4 w-4 rounded bg-muted animate-pulse mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-4 rounded bg-muted animate-pulse" style={{ width: `${[55, 72, 40, 63][i]}%` }} />
                            <div className="h-3 w-8 rounded bg-muted animate-pulse ml-auto shrink-0" />
                            <div className="h-6 w-6 rounded bg-muted animate-pulse shrink-0" />
                          </div>
                          {i % 2 === 0 && <div className="h-3 w-20 rounded-full bg-muted animate-pulse" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-destructive">エラーが発生しました: {error.message}</div>
                </div>
              ) : sortedTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {hasActiveFilters ? (
                    <p>条件に一致するタスクがありません</p>
                  ) : (
                    <>
                      <p>タスクがありません</p>
                      <p className="text-sm mt-1">
                        <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">N</kbd> キーまたは下の{" "}
                        <span className="text-primary font-semibold">＋</span> ボタンから新しいタスクを追加しましょう
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <TaskSection
                  hideHeader
                  tasks={sortedTasks}
                  handlers={taskHandlers}
                  showScheduledDate
                  enableDragAndDrop={viewMode === "list" && listSort === "displayOrder"}
                  onReorder={handleReorder}
                  matchReasons={dateFilter ? sortedTasks.map(getMatchReasons) : undefined}
                />
              )}
            </div>
          </main>

          <TaskFab onClick={() => setTaskInputOpen(true)} />
        </div>
      </div>

      <FilterFab onClick={() => setFilterSheetOpen(true)} activeFilterCount={countActiveFilters(filterValues, categoryFilter.type !== "all")} />
      <FilterBottomSheet {...bottomSheetProps} />

      <TaskCreateModal
        key={taskInputOpen ? "task-create-open" : "task-create-closed"}
        open={taskInputOpen}
        onOpenChange={setTaskInputOpen}
        onSubmit={handleCreateTask}
        categories={categories}
        groups={groups}
        defaultCategoryId={defaultCategoryId}
        isLoading={mutations.createTask.isPending}
      />

      <TaskDetailModal
        task={detailTask}
        open={detailTaskId !== null}
        onClose={() => setDetailTaskId(null)}
        onUncomplete={handleUncomplete}
        onSkip={(id) => {
          setDetailTaskId(null);
          handleSkip(id);
        }}
        onUnskip={(id) => mutations.unskipTask.mutate(id)}
        onDelete={(id) => {
          setDetailTaskId(null);
          handleDelete(id);
        }}
        onToggleFavorite={handleToggleFavorite}
        categories={categories}
        groups={groups}
      />

      <SkipReasonDialog
        key={skippingTask?.id ?? "skip-closed"}
        open={skippingTask !== null}
        onOpenChange={(open) => !open && setSkippingTask(null)}
        taskTitle={skippingTask?.title || ""}
        onConfirm={handleSkipConfirm}
        isLoading={mutations.skipTask.isPending}
      />

      <DeleteConfirmDialog
        open={deletingTaskId !== null}
        onOpenChange={(open) => !open && setDeletingTaskId(null)}
        title="タスクを削除しますか？"
        description="この操作は元に戻せません。"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
