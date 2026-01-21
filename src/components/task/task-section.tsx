"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  /** ドラッグ&ドロップを有効にするか（未完了タスクのみ） */
  enableDragAndDrop?: boolean;
  /** 並び替え完了時のコールバック */
  onReorder?: (taskId: string, beforeTaskId?: string, afterTaskId?: string) => void;
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

interface SortableTaskCardProps {
  task: Task;
  handlers: TaskCardHandlers;
  showScheduledDate?: boolean;
}

function SortableTaskCard({
  task,
  handlers,
  showScheduledDate,
}: SortableTaskCardProps) {
  const { setNodeRef, transform, transition, isDragging, listeners } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-grab active:cursor-grabbing"
      {...listeners}
    >
      <TaskCard
        task={task}
        handlers={handlers}
        showScheduledDate={showScheduledDate}
      />
    </div>
  );
}

export function TaskSection({
  title,
  tasks,
  defaultCollapsed = false,
  variant = "default",
  handlers,
  showScheduledDate = false,
  enableDragAndDrop = false,
  onReorder,
}: TaskSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [localTasks, setLocalTasks] = useState(tasks);

  // tasksが変更されたらlocalTasksを更新
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4, // 4px移動するまでドラッグ開始しない（クリックと区別）
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);

        // 並び替えをサーバーに送信
        const taskId = active.id as string;
        const beforeTaskId = newIndex > 0 ? newOrder[newIndex - 1].id : undefined;
        const afterTaskId = newIndex < newOrder.length - 1 ? newOrder[newIndex + 1].id : undefined;

        onReorder?.(taskId, beforeTaskId, afterTaskId);

        return newOrder;
      });
    }
  };

  if (tasks.length === 0) return null;

  const displayTasks = enableDragAndDrop ? localTasks : tasks;

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
          {enableDragAndDrop ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayTasks.map((task) => task.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {displayTasks.map((task) => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      handlers={handlers}
                      showScheduledDate={showScheduledDate}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            displayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                handlers={handlers}
                showScheduledDate={showScheduledDate}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
