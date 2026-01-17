"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header, CategoryFilter } from "@/components/layout";
import {
  TaskSection,
  TaskInputModal,
  TaskFab,
  TaskEditDialog,
  SkipReasonDialog,
  type TaskEditData,
} from "@/components/task";
import {
  useAllTasks,
  useTaskMutations,
  useSettings,
  useCategories,
} from "@/hooks";
import type { Task } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLのクエリパラメータからカテゴリを取得
  // null = すべて, "none" = カテゴリなし, それ以外 = 特定カテゴリID
  const selectedCategoryId = searchParams.get("category") || null;

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [skippingTask, setSkippingTask] = useState<Task | null>(null);
  const [taskInputOpen, setTaskInputOpen] = useState(false);

  // カテゴリ選択時にURLを更新
  const handleCategoryChange = (categoryId: string | null) => {
    if (categoryId === null) {
      router.push("/");
    } else {
      router.push(`/?category=${categoryId}`);
    }
  };

  const { settings } = useSettings();
  // "none"の場合はnullに変換してサーバーに渡す
  const categoryIdForQuery =
    selectedCategoryId === "none" ? null : selectedCategoryId;
  const { data: tasks, isLoading, error } = useAllTasks(
    selectedCategoryId === null ? undefined : categoryIdForQuery,
  );
  const { data: categories = [] } = useCategories();
  const mutations = useTaskMutations();

  const handleCreateTask = (data: {
    title: string;
    scheduledAt?: string;
    categoryId?: string;
    priority?: "HIGH" | "MEDIUM" | "LOW";
    memo?: string;
  }) => {
    mutations.createTask.mutate(data);
  };

  const handleReorder = (taskIds: string[]) => {
    console.log("Reordering tasks:", taskIds);
    mutations.reorderTasks.mutate(taskIds);
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

  const handleEditTaskWithDetails = async (data: TaskEditData) => {
    try {
      await mutations.updateTask.mutateAsync(data);
      setEditingTask(null);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleSkip = (id: string) => {
    if (!tasks) return;
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setSkippingTask(task);
    }
  };

  const handleSkipConfirm = (reason?: string) => {
    if (skippingTask) {
      mutations.skipTask.mutate({ id: skippingTask.id, reason });
      setSkippingTask(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("このタスクを削除しますか？")) {
      mutations.deleteTask.mutate(id);
    }
  };

  const taskHandlers = {
    onComplete: handleComplete,
    onUncomplete: handleUncomplete,
    onEdit: handleEdit,
    onSkip: handleSkip,
    onDelete: handleDelete,
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-56px)] md:h-screen">
          <div className="text-muted-foreground">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-56px)] md:h-screen">
          <div className="text-destructive">
            エラーが発生しました: {error.message}
          </div>
        </div>
      </div>
    );
  }

  // ステータス別に分類
  // 未完了: サーバーから取得した順序をそのまま使用（displayOrder優先、次に作成日降順）
  const pendingTasks =
    tasks?.filter((task) => task.status === "PENDING") || [];

  // 完了済み: 完了日時降順（新しい順）
  const completedTasks =
    tasks
      ?.filter((task) => task.status === "COMPLETED")
      .sort(
        (a, b) =>
          new Date(b.completedAt || b.createdAt).getTime() -
          new Date(a.completedAt || a.createdAt).getTime(),
      ) || [];

  // やらない: スキップ日時降順（新しい順）
  const skippedTasks =
    tasks
      ?.filter((task) => task.status === "SKIPPED")
      .sort(
        (a, b) =>
          new Date(b.skippedAt || b.createdAt).getTime() -
          new Date(a.skippedAt || a.createdAt).getTime(),
      ) || [];

  const hasNoTasks =
    pendingTasks.length === 0 &&
    completedTasks.length === 0 &&
    skippedTasks.length === 0;

  return (
    <div className="flex-1 bg-background flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto">
        <CategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={handleCategoryChange}
        />

        <main className="flex-1 overflow-auto pb-20 md:pb-4">
          <div className="px-4 py-4">
            {hasNoTasks ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>タスクがありません</p>
                <p className="text-sm mt-1">
                  下の入力欄から新しいタスクを追加しましょう
                </p>
              </div>
            ) : (
              <>
                {/* 未完了タスク */}
                <TaskSection
                  title="未完了"
                  tasks={pendingTasks}
                  handlers={taskHandlers}
                  showScheduledDate
                  enableDragAndDrop
                  onReorder={handleReorder}
                />

                {/* 完了済みタスク */}
                <TaskSection
                  title="完了済み"
                  tasks={completedTasks}
                  variant="completed"
                  defaultCollapsed={settings.autoCollapseCompleted}
                  handlers={taskHandlers}
                  showScheduledDate
                />

                {/* やらないタスク */}
                <TaskSection
                  title="やらない"
                  tasks={skippedTasks}
                  variant="skipped"
                  defaultCollapsed={settings.autoCollapseSkipped}
                  handlers={taskHandlers}
                  showScheduledDate
                />
              </>
            )}
          </div>
        </main>

        <TaskFab onClick={() => setTaskInputOpen(true)} />
      </div>

      <TaskInputModal
        open={taskInputOpen}
        onOpenChange={setTaskInputOpen}
        onSubmit={handleCreateTask}
        categories={categories}
        defaultCategoryId={
          selectedCategoryId === null || selectedCategoryId === "none"
            ? undefined
            : selectedCategoryId
        }
        isLoading={mutations.createTask.isPending}
      />

      <TaskEditDialog
        open={editingTask !== null}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSave={handleEditTaskWithDetails}
        task={editingTask}
        categories={categories}
        isLoading={mutations.updateTask.isPending}
      />

      <SkipReasonDialog
        open={skippingTask !== null}
        onOpenChange={(open) => !open && setSkippingTask(null)}
        taskTitle={skippingTask?.title || ""}
        onConfirm={handleSkipConfirm}
        isLoading={mutations.skipTask.isPending}
      />
    </div>
  );
}
