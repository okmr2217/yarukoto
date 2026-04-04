"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterArea, FilterFab, FilterBottomSheet, type FilterValues } from "@/components/layout";
import {
  TaskSection,
  TaskInputModal,
  TaskFab,
  TaskEditDialog,
  SkipReasonDialog,
  TaskDetailSheet,
  type TaskEditData,
} from "@/components/task";
import { getTaskDetail } from "@/actions/task";
import type { TaskDetail } from "@/types";
import {
  useAllTasks,
  useTaskMutations,
  useSettings,
  useCategories,
} from "@/hooks";
import { CATEGORY_DESELECTED_SENTINEL } from "@/lib/constants";
import type { Task } from "@/types";
import { formatDateToJST } from "@/lib/dateUtils";

function countActiveFilters(values: FilterValues): number {
  let count = 0;
  if (values.keyword) count++;
  if (values.status !== "all") count++;
  if (values.date) count++;
  if (values.isFavorite) count++;
  return count;
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLクエリパラメータからフィルタ状態を読み取る
  const categoryParam = searchParams.get("category");
  const isDefaultAllSelected = categoryParam === null;
  const isAllDeselected = categoryParam === CATEGORY_DESELECTED_SENTINEL;
  const dateFilter = searchParams.get("date") || "";
  const keyword = searchParams.get("keyword") || "";
  const statusFilter = (searchParams.get("status") || "all") as FilterValues["status"];
  const favoriteFilter = searchParams.get("favorite") === "true";

  const hasActiveFilters = !!(dateFilter || keyword || statusFilter !== "all" || favoriteFilter || !isDefaultAllSelected);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [skippingTask, setSkippingTask] = useState<Task | null>(null);
  const [taskInputOpen, setTaskInputOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // URLクエリパラメータ更新ヘルパー
  const updateSearchParams = (updates: Record<string, string | null>) => {
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
  };

  const handleToggleCategory = (categoryId: string) => {
    const next = effectiveSelectedIds.includes(categoryId)
      ? effectiveSelectedIds.filter((id) => id !== categoryId)
      : [...effectiveSelectedIds, categoryId];

    if (next.length === 0) {
      updateSearchParams({ category: CATEGORY_DESELECTED_SENTINEL });
    } else {
      const allIds = [...categories.map((c) => c.id), "none"];
      const isAllSelected = allIds.length === next.length && allIds.every((id) => next.includes(id));
      updateSearchParams({ category: isAllSelected ? null : next.join(",") });
    }
  };

  const handleSelectAllCategories = () => {
    updateSearchParams({ category: null }); // null = デフォルト全選択
  };

  const handleDeselectAllCategories = () => {
    updateSearchParams({ category: CATEGORY_DESELECTED_SENTINEL });
  };

  const handleApplyFilters = (values: FilterValues) => {
    const params = new URLSearchParams(searchParams.toString());
    if (values.keyword) params.set("keyword", values.keyword); else params.delete("keyword");
    if (values.status !== "all") params.set("status", values.status); else params.delete("status");
    if (values.date) params.set("date", values.date); else params.delete("date");
    if (values.isFavorite) params.set("favorite", "true"); else params.delete("favorite");
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  };

  const handleClearFilters = () => {
    updateSearchParams({ keyword: null, status: null, favorite: null, date: null });
  };

  const filterValues: FilterValues = {
    keyword,
    status: statusFilter,
    isFavorite: favoriteFilter,
    date: dateFilter,
  };

  const { settings } = useSettings();

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  // カテゴリの表示状態（チップのアクティブ状態に使用）
  const effectiveSelectedIds = isDefaultAllSelected
    ? [...categories.map((c) => c.id), "none"]
    : isAllDeselected
    ? []
    : (categoryParam?.split(",") ?? []);

  const { data: tasks, isLoading, error } = useAllTasks(
    {
      categoryIds: isDefaultAllSelected ? undefined : effectiveSelectedIds,
      date: dateFilter || undefined,
      keyword: keyword || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      isFavorite: favoriteFilter || undefined,
    },
    { enabled: !isAllDeselected },
  );
  const mutations = useTaskMutations();

  const handleCreateTask = (data: {
    title: string;
    scheduledAt?: string;
    categoryId?: string;
    memo?: string;
  }) => {
    mutations.createTask.mutate(data);
  };

  const handleReorder = (taskId: string, beforeTaskId?: string, afterTaskId?: string) => {
    mutations.reorderTasks.mutate({ taskId, beforeTaskId, afterTaskId });
  };

  const handleComplete = (id: string) => {
    mutations.completeTask.mutate(id);
  };

  const handleUncomplete = (id: string) => {
    mutations.uncompleteTask.mutate(id);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  const handleEditTaskWithDetails = (data: TaskEditData) => {
    setEditingTask(null);
    mutations.updateTask.mutate(data);
  };

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

  const handleUnskip = (id: string) => {
    mutations.unskipTask.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (confirm("このタスクを削除しますか？")) {
      mutations.deleteTask.mutate(id);
    }
  };

  const handleDetail = async (id: string) => {
    const result = await getTaskDetail(id);
    if (result.success) {
      setDetailTask(result.data);
      setDetailOpen(true);
    }
  };

  const handleToggleFavorite = (id: string) => {
    mutations.toggleFavorite.mutate(id);
  };

  const taskHandlers = {
    onDetail: handleDetail,
    onComplete: handleComplete,
    onUncomplete: handleUncomplete,
    onEdit: handleEdit,
    onSkip: handleSkip,
    onUnskip: handleUnskip,
    onDelete: handleDelete,
    onToggleFavorite: handleToggleFavorite,
  };

  // Nキーでタスク作成モーダルを開く
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

  // 日付フィルタ時のマッチ理由を算出（クライアント側）
  const getMatchReasons = (task: Task): string[] => {
    if (!dateFilter) return [];
    const reasons: string[] = [];
    if (task.scheduledAt === dateFilter) reasons.push("予定日");
    if (task.completedAt && formatDateToJST(new Date(task.completedAt)) === dateFilter) {
      reasons.push("この日に完了");
    }
    if (task.skippedAt && formatDateToJST(new Date(task.skippedAt)) === dateFilter) {
      reasons.push("この日にやらない");
    }
    if (formatDateToJST(new Date(task.createdAt)) === dateFilter && task.scheduledAt !== dateFilter) {
      reasons.push("この日に作成");
    }
    return reasons;
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-background flex flex-col">
        <div className="md:hidden sticky top-0 z-10">
          <FilterArea
            categories={categories}
            selectedCategoryIds={effectiveSelectedIds}
            onToggleCategory={handleToggleCategory}
            onSelectAll={handleSelectAllCategories}
            onDeselectAll={handleDeselectAllCategories}
            categoriesLoading={categoriesLoading}
          />
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0 px-4 pt-2 pb-24 md:pb-4">
            <div className="flex items-center gap-1 py-2 mb-1">
              <div className="h-4 w-4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-12 rounded bg-muted animate-pulse" />
              <div className="h-3 w-6 rounded bg-muted animate-pulse ml-1" />
            </div>
            <div className="rounded-lg border border-border overflow-hidden bg-card">
              {[0, 1, 2, 3].map((i) => (
                <div key={i}>
                  {i > 0 && <div className="border-t border-border" />}
                  <div className="flex p-3 gap-3">
                    <div className="h-4 w-4 rounded bg-muted animate-pulse mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 rounded bg-muted animate-pulse"
                          style={{ width: `${[55, 72, 40, 63][i]}%` }}
                        />
                        <div className="h-3 w-8 rounded bg-muted animate-pulse ml-auto flex-shrink-0" />
                        <div className="h-6 w-6 rounded bg-muted animate-pulse flex-shrink-0" />
                      </div>
                      {i % 2 === 0 && (
                        <div className="h-3 w-20 rounded-full bg-muted animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="text-destructive">エラーが発生しました: {error.message}</div>
        </div>
      </div>
    );
  }

  const pendingTasks = tasks?.filter((t) => t.status === "PENDING") || [];

  const completedTasks = (tasks?.filter((t) => t.status === "COMPLETED") || []).sort(
    (a, b) =>
      new Date(b.completedAt || b.createdAt).getTime() -
      new Date(a.completedAt || a.createdAt).getTime(),
  );

  const skippedTasks = (tasks?.filter((t) => t.status === "SKIPPED") || []).sort(
    (a, b) =>
      new Date(b.skippedAt || b.createdAt).getTime() -
      new Date(a.skippedAt || a.createdAt).getTime(),
  );

  const hasNoTasks =
    pendingTasks.length === 0 && completedTasks.length === 0 && skippedTasks.length === 0;

  return (
    <div className="flex-1 bg-background flex flex-col">
      {/* モバイル: カテゴリフィルタエリア */}
      <div className="md:hidden sticky top-0 z-10">
        <FilterArea
          categories={categories}
          selectedCategoryIds={effectiveSelectedIds}
          onToggleCategory={handleToggleCategory}
          onSelectAll={handleSelectAllCategories}
          onDeselectAll={handleDeselectAllCategories}
          categoriesLoading={categoriesLoading}
        />
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1">
            <div className="px-4 pt-2 pb-24 md:pb-4">
              {hasNoTasks ? (
                <div className="text-center py-12 text-muted-foreground">
                  {hasActiveFilters ? (
                    <p>条件に一致するタスクがありません</p>
                  ) : (
                    <>
                      <p>タスクがありません</p>
                      <p className="text-sm mt-1">
                        <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">N</kbd>{" "}
                        キーまたは下の <span className="text-primary font-semibold">＋</span>{" "}
                        ボタンから新しいタスクを追加しましょう
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <TaskSection
                    title="未完了"
                    tasks={pendingTasks}
                    handlers={taskHandlers}
                    showScheduledDate
                    enableDragAndDrop={!hasActiveFilters}
                    onReorder={handleReorder}
                    matchReasons={dateFilter ? pendingTasks.map(getMatchReasons) : undefined}
                  />

                  <TaskSection
                    title="完了済み"
                    tasks={completedTasks}
                    variant="completed"
                    defaultCollapsed={settings.autoCollapseCompleted}
                    handlers={taskHandlers}
                    showScheduledDate
                    matchReasons={dateFilter ? completedTasks.map(getMatchReasons) : undefined}
                  />

                  <TaskSection
                    title="やらない"
                    tasks={skippedTasks}
                    variant="skipped"
                    defaultCollapsed={settings.autoCollapseSkipped}
                    handlers={taskHandlers}
                    showScheduledDate
                    matchReasons={dateFilter ? skippedTasks.map(getMatchReasons) : undefined}
                  />
                </>
              )}
            </div>
          </main>

          <TaskFab onClick={() => setTaskInputOpen(true)} />
        </div>
      </div>

      {/* モバイル: フィルター FAB */}
      <FilterFab
        onClick={() => setFilterSheetOpen(true)}
        activeFilterCount={countActiveFilters(filterValues)}
      />

      {/* モバイル: フィルター ボトムシート（開くたびに現在のフィルタ値でリセット） */}
      <FilterBottomSheet
        key={filterSheetOpen ? "filter-open" : "filter-closed"}
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filterValues={filterValues}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <TaskInputModal
        key={taskInputOpen ? "task-input-open" : "task-input-closed"}
        open={taskInputOpen}
        onOpenChange={setTaskInputOpen}
        onSubmit={handleCreateTask}
        categories={categories}
        defaultCategoryId={
          !isDefaultAllSelected && !isAllDeselected && effectiveSelectedIds.length === 1 && effectiveSelectedIds[0] !== "none"
            ? effectiveSelectedIds[0]
            : undefined
        }
        isLoading={mutations.createTask.isPending}
      />

      <TaskEditDialog
        key={editingTask?.id ?? "task-edit-closed"}
        open={editingTask !== null}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSave={handleEditTaskWithDetails}
        task={editingTask}
        categories={categories}
      />

      <SkipReasonDialog
        key={skippingTask?.id ?? "skip-closed"}
        open={skippingTask !== null}
        onOpenChange={(open) => !open && setSkippingTask(null)}
        taskTitle={skippingTask?.title || ""}
        onConfirm={handleSkipConfirm}
        isLoading={mutations.skipTask.isPending}
      />

      <TaskDetailSheet task={detailTask} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
