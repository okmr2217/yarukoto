"use client";

import { TaskCard, type TaskCardHandlers } from "@/components/task";
import type { Task } from "@/types";

type SearchResultsProps = {
  tasks: Task[];
  total: number;
  isLoading: boolean;
  hasSearchCriteria: boolean;
  handlers: TaskCardHandlers;
};

export function SearchResults({
  tasks,
  total,
  isLoading,
  hasSearchCriteria,
  handlers,
}: SearchResultsProps) {
  if (!hasSearchCriteria) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>検索条件を入力してください</p>
        <p className="text-sm mt-1">
          キーワード、ステータス、カテゴリなどで絞り込みできます
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">検索中...</div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>該当するタスクがありません</p>
        <p className="text-sm mt-1">検索条件を変更してみてください</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results count */}
      <div className="text-sm text-muted-foreground">検索結果: {total}件</div>

      {/* Tasks */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            handlers={handlers}
            showScheduledDate={true}
          />
        ))}
      </div>
    </div>
  );
}
