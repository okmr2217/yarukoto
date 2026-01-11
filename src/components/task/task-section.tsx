"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TaskCard, type TaskCardHandlers } from "./task-card";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface TaskSectionProps {
  /** セクションタイトル */
  title: string;
  /** 表示するタスクリスト */
  tasks: Task[];
  /** デフォルトで折りたたむか */
  defaultCollapsed?: boolean;
  /** セクションのバリアント（スタイル） */
  variant?: "default" | "completed" | "skipped" | "overdue";
  /** タスク操作のハンドラー群 */
  handlers: TaskCardHandlers;
  /** 予定日を表示するか */
  showScheduledDate?: boolean;
}

const variantStyles = {
  default: "",
  completed: "opacity-70",
  skipped: "opacity-70",
  overdue: "",
};

const titleStyles = {
  default: "text-foreground",
  completed: "text-success",
  skipped: "text-muted-foreground",
  overdue: "text-destructive",
};

export function TaskSection({
  title,
  tasks,
  defaultCollapsed = false,
  variant = "default",
  handlers,
  showScheduledDate = false,
}: TaskSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (tasks.length === 0) return null;

  return (
    <div className={cn("mb-4", variantStyles[variant])}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-1 w-full py-2 text-left"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
        <span className={cn("text-sm font-medium", titleStyles[variant])}>
          {title}
        </span>
        <span className="text-xs text-muted-foreground ml-1">
          ({tasks.length})
        </span>
      </button>
      {!isCollapsed && (
        <div className="space-y-2 mt-1">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              handlers={handlers}
              showScheduledDate={showScheduledDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
