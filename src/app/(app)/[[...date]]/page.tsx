"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header, DateNavigation, CategoryFilter } from "@/components/layout";
import {
  TaskSection,
  TaskInputModal,
  TaskFab,
  TaskEditDialog,
  SkipReasonDialog,
  type TaskEditData,
} from "@/components/task";
import { CalendarDialog } from "@/components/calendar";
import {
  useTasks,
  useTaskMutations,
  useSettings,
  useCategories,
} from "@/hooks";
import type { Task } from "@/types";
import {
  formatDateForDisplay,
  getTodayInJST,
  addDaysJST,
  parseJSTDate,
} from "@/lib/dateUtils";

// YYYY-MM-DD文字列からローカルのDateオブジェクトを作成
function dateFromString(dateStr: string): Date {
  return parseJSTDate(dateStr);
}

export default function TaskPage() {
  const params = useParams();
  const router = useRouter();

  // Optional catch-all: params.date is string[] | undefined
  const dateSegments = params.date as string[] | undefined;
  const today = getTodayInJST();
  const targetDate = dateSegments?.[0] || today;

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [skippingTask, setSkippingTask] = useState<Task | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [taskInputOpen, setTaskInputOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const { settings } = useSettings();
  const { data: tasks, isLoading, error } = useTasks(targetDate);
  const { data: categories = [] } = useCategories();
  const mutations = useTaskMutations();

  const isToday = targetDate === today;
  const isPast = targetDate < today;
  const isFuture = targetDate > today;

  const handleNavigate = (newDate: string) => {
    if (newDate === today) {
      router.push("/");
    } else {
      router.push(`/${newDate}`);
    }
  };

  const handlePrevious = () => {
    handleNavigate(addDaysJST(targetDate, -1));
  };

  const handleNext = () => {
    handleNavigate(addDaysJST(targetDate, 1));
  };

  const handleToday = () => {
    router.push("/");
  };

  const handleDatePicker = () => {
    setDatePickerOpen(true);
  };

  const handleCreateTask = (data: {
    title: string;
    scheduledAt?: string;
    categoryId?: string;
    priority?: "HIGH" | "MEDIUM" | "LOW";
    memo?: string;
  }) => {
    mutations.createTask.mutate(data);
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
    const allTasks = isToday
      ? [
          ...tasks.overdue,
          ...tasks.today,
          ...tasks.undated,
          ...tasks.completed,
          ...tasks.skipped,
        ]
      : [...tasks.scheduled, ...tasks.completed, ...tasks.skipped];

    const task = allTasks.find((t) => t.id === id);
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

  // タスクカード用のハンドラーをまとめる
  const taskHandlers = {
    onComplete: handleComplete,
    onUncomplete: handleUncomplete,
    onEdit: handleEdit,
    onSkip: handleSkip,
    onDelete: handleDelete,
  };

  const filterTasksByCategory = (taskList: Task[]): Task[] => {
    if (selectedCategoryId === null) return taskList;
    if (selectedCategoryId === "none") {
      return taskList.filter((task) => !task.categoryId);
    }
    return taskList.filter((task) => task.categoryId === selectedCategoryId);
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

  // フィルター済みタスク
  const filteredTasks = tasks
    ? {
        overdue: filterTasksByCategory(tasks.overdue),
        today: filterTasksByCategory(tasks.today),
        undated: filterTasksByCategory(tasks.undated),
        scheduled: filterTasksByCategory(tasks.scheduled),
        completed: filterTasksByCategory(tasks.completed),
        skipped: filterTasksByCategory(tasks.skipped),
      }
    : null;

  const hasNoTasks = !filteredTasks
    ? true
    : isToday
      ? filteredTasks.overdue.length === 0 &&
        filteredTasks.today.length === 0 &&
        filteredTasks.undated.length === 0 &&
        filteredTasks.completed.length === 0 &&
        filteredTasks.skipped.length === 0
      : filteredTasks.scheduled.length === 0 &&
        filteredTasks.completed.length === 0 &&
        filteredTasks.skipped.length === 0;

  return (
    <div className="flex-1 bg-background flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto">
        <DateNavigation
          currentDate={dateFromString(targetDate)}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
          onDatePicker={handleDatePicker}
        />

        <CategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        <main className="flex-1 overflow-auto pb-20 md:pb-4">
          <div className="px-4 py-4">
            {/* Date title with badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-bold">
                {isToday
                  ? "今日のタスク"
                  : formatDateForDisplay(dateFromString(targetDate))}
              </span>
              {isToday && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                  今日
                </span>
              )}
              {isPast && (
                <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                  過去
                </span>
              )}
              {isFuture && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                  未来
                </span>
              )}
            </div>

            {hasNoTasks ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>
                  {isToday
                    ? "タスクがありません"
                    : "この日のタスクはありません"}
                </p>
                <p className="text-sm mt-1">
                  {isToday || isFuture
                    ? "下の入力欄から新しいタスクを追加しましょう"
                    : "過去の日付にはタスクを追加できません"}
                </p>
              </div>
            ) : (
              <>
                {/* === 今日の表示 === */}
                {isToday && (
                  <>
                    {/* 期限超過 */}
                    <TaskSection
                      title="期限超過"
                      tasks={filteredTasks?.overdue || []}
                      variant="overdue"
                      handlers={taskHandlers}
                      showScheduledDate
                    />

                    {/* 今日 */}
                    <TaskSection
                      title="今日"
                      tasks={filteredTasks?.today || []}
                      handlers={taskHandlers}
                    />

                    {/* 日付未定 */}
                    <TaskSection
                      title="日付未定"
                      tasks={filteredTasks?.undated || []}
                      handlers={taskHandlers}
                    />

                    {/* 今日完了 */}
                    <TaskSection
                      title="今日完了"
                      tasks={filteredTasks?.completed || []}
                      variant="completed"
                      defaultCollapsed={settings.autoCollapseCompleted}
                      handlers={taskHandlers}
                    />

                    {/* 今日やらない */}
                    <TaskSection
                      title="今日やらない"
                      tasks={filteredTasks?.skipped || []}
                      variant="skipped"
                      defaultCollapsed={settings.autoCollapseSkipped}
                      handlers={taskHandlers}
                    />
                  </>
                )}

                {/* === 過去の日付の表示 === */}
                {isPast && (
                  <>
                    {/* この日に完了 */}
                    <TaskSection
                      title="この日に完了"
                      tasks={filteredTasks?.completed || []}
                      variant="completed"
                      defaultCollapsed={settings.autoCollapseCompleted}
                      handlers={taskHandlers}
                    />

                    {/* この日にやらない */}
                    <TaskSection
                      title="この日にやらない"
                      tasks={filteredTasks?.skipped || []}
                      variant="skipped"
                      defaultCollapsed={settings.autoCollapseSkipped}
                      handlers={taskHandlers}
                    />

                    {/* この日が予定日 */}
                    <TaskSection
                      title="この日が予定日"
                      tasks={filteredTasks?.scheduled || []}
                      handlers={taskHandlers}
                      showScheduledDate
                    />
                  </>
                )}

                {/* === 未来の日付の表示 === */}
                {isFuture && (
                  <TaskSection
                    title="予定タスク"
                    tasks={filteredTasks?.scheduled || []}
                    handlers={taskHandlers}
                  />
                )}
              </>
            )}
          </div>
        </main>

        {/* FABボタン: 今日と未来のみ表示 */}
        {(isToday || isFuture) && (
          <TaskFab onClick={() => setTaskInputOpen(true)} />
        )}
      </div>

      <TaskInputModal
        open={taskInputOpen}
        onOpenChange={setTaskInputOpen}
        onSubmit={handleCreateTask}
        categories={categories}
        defaultDate={targetDate}
        defaultCategoryId={selectedCategoryId}
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

      <CalendarDialog
        open={datePickerOpen}
        onOpenChange={setDatePickerOpen}
        currentDate={dateFromString(targetDate)}
        onSelectDate={handleNavigate}
      />
    </div>
  );
}
