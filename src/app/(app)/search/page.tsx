"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SearchFiltersComponent, SearchResults } from "@/components/search";
import {
  TaskEditDialog,
  SkipReasonDialog,
  type TaskEditData,
} from "@/components/task";
import {
  useSearchTasks,
  useCategories,
  useUpdateTask,
  useCompleteTask,
  useUncompleteTask,
  useSkipTask,
  useDeleteTask,
  useInvalidateSearchTasks,
  type SearchFilters,
} from "@/hooks";
import type { Task } from "@/types";

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: "",
    status: "all",
    categoryId: undefined,
    priority: undefined,
    dateFrom: undefined,
    dateTo: undefined,
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [skippingTask, setSkippingTask] = useState<Task | null>(null);

  const { data: categories = [] } = useCategories();
  const {
    data: searchResults,
    isLoading,
    isFetching,
  } = useSearchTasks(filters);

  const updateTask = useUpdateTask();
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();
  const skipTask = useSkipTask();
  const deleteTask = useDeleteTask();
  const invalidateSearch = useInvalidateSearchTasks();

  const hasSearchCriteria =
    filters.keyword.trim() !== "" ||
    filters.status !== "all" ||
    filters.categoryId !== undefined ||
    filters.priority !== undefined ||
    filters.dateFrom !== undefined ||
    filters.dateTo !== undefined;

  const handleComplete = (id: string) => {
    completeTask.mutate(id, {
      onSuccess: invalidateSearch,
    });
  };

  const handleUncomplete = (id: string) => {
    uncompleteTask.mutate(id, {
      onSuccess: invalidateSearch,
    });
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  const handleEditTaskWithDetails = async (data: TaskEditData) => {
    try {
      await updateTask.mutateAsync(data);
      invalidateSearch();
      setEditingTask(null);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleSkip = (id: string) => {
    const allTasks = searchResults?.groups.flatMap((g) => g.tasks) || [];
    const task = allTasks.find((t) => t.id === id);
    if (task) {
      setSkippingTask(task);
    }
  };

  const handleSkipConfirm = (reason?: string) => {
    if (skippingTask) {
      skipTask.mutate(
        { id: skippingTask.id, reason },
        {
          onSuccess: invalidateSearch,
        },
      );
      setSkippingTask(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("このタスクを削除しますか？")) {
      deleteTask.mutate(id, {
        onSuccess: invalidateSearch,
      });
    }
  };

  // タスクカード用のハンドラーをまとめる
  const taskHandlers = {
    onComplete: handleComplete,
    onUncomplete: handleUncomplete,
    onEdit: handleEdit,
    onSkip: handleSkip,
    onDelete: handleDelete,
  };

  return (
    <div className="flex-1 bg-background flex flex-col">
      {/* Header - Mobile only */}
      <header className="sticky top-0 z-10 bg-background border-b border-border md:hidden">
        <div className="flex items-center h-14 px-4">
          <Link href="/" className="p-2 -ml-2 hover:bg-accent rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="ml-2 text-lg font-semibold">タスク検索</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto">
        {/* PC Header */}
        <header className="hidden md:flex items-center h-14 px-4 border-b border-border">
          <h1 className="text-lg font-semibold">タスク検索</h1>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="px-4 py-4 space-y-6">
            {/* Search Filters */}
            <div className="bg-card p-4 rounded-lg border border-border">
              <SearchFiltersComponent
                filters={filters}
                onFiltersChange={setFilters}
                categories={categories}
              />
            </div>

            {/* Search Results */}
            <SearchResults
              groups={searchResults?.groups || []}
              total={searchResults?.total || 0}
              isLoading={isLoading || isFetching}
              hasSearchCriteria={hasSearchCriteria}
              handlers={taskHandlers}
            />
          </div>
        </main>
      </div>

      {/* Edit Dialog */}
      <TaskEditDialog
        open={editingTask !== null}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSave={handleEditTaskWithDetails}
        task={editingTask}
        categories={categories}
        isLoading={updateTask.isPending}
      />

      {/* Skip Reason Dialog */}
      <SkipReasonDialog
        open={skippingTask !== null}
        onOpenChange={(open) => !open && setSkippingTask(null)}
        taskTitle={skippingTask?.title || ""}
        onConfirm={handleSkipConfirm}
        isLoading={skipTask.isPending}
      />
    </div>
  );
}
