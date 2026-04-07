"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
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
  title?: string;
  /** タイトルの補足説明（日付フィルター時などに表示） */
  subtitle?: string;
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
  /** ドラッグ&ドロップを有効にするか */
  enableDragAndDrop?: boolean;
  /** 並び替え完了時のコールバック */
  onReorder?: (taskId: string, beforeTaskId?: string, afterTaskId?: string) => void;
  /** 日付フィルタ時のマッチ理由（tasks と同順で対応） */
  matchReasons?: string[][];
  /** セクションヘッダーを非表示にする（フラット表示用） */
  hideHeader?: boolean;
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
  enableDragAndDrop?: boolean;
  matchReasons?: string[];
}

function SortableTaskCard({
  task,
  handlers,
  showScheduledDate,
  enableDragAndDrop,
  matchReasons,
}: SortableTaskCardProps) {
  const { setNodeRef, transform, transition, isDragging, listeners, attributes } =
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
    >
      <TaskCard
        task={task}
        handlers={handlers}
        showScheduledDate={showScheduledDate}
        enableDragAndDrop={enableDragAndDrop}
        dragHandleListeners={listeners}
        dragHandleAttributes={attributes}
        matchReasons={matchReasons}
      />
    </div>
  );
}

export function TaskSection({
  title,
  subtitle,
  tasks,
  defaultCollapsed = false,
  variant = "default",
  handlers,
  showScheduledDate = false,
  enableDragAndDrop = false,
  onReorder,
  matchReasons,
  hideHeader = false,
}: TaskSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed && !hideHeader);
  const [localTasks, setLocalTasks] = useState(tasks);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const prevTasksRef = useRef(tasks);

  // matchReasons を task ID → reasons のマップに変換（DnD 並び替え・exit アニメーション時のインデックスずれを防ぐ）
  const matchReasonsMap = useMemo(() => {
    if (!matchReasons) return {} as Record<string, string[]>;
    return Object.fromEntries(tasks.map((t, i) => [t.id, matchReasons[i] ?? []]));
  }, [tasks, matchReasons]);

  // tasks 変更を検知：削除されたタスクは 200ms exit アニメーション後に DOM 削除
  useEffect(() => {
    const prevTasks = prevTasksRef.current;
    const removedIds = prevTasks.filter((pt) => !tasks.some((t) => t.id === pt.id)).map((pt) => pt.id);
    prevTasksRef.current = tasks;

    if (removedIds.length > 0) {
      setExitingIds((prev) => new Set([...prev, ...removedIds]));
      setTimeout(() => {
        setLocalTasks(tasks);
        setExitingIds((prev) => {
          const next = new Set(prev);
          removedIds.forEach((id) => next.delete(id));
          return next;
        });
      }, 200);
    } else {
      setLocalTasks(tasks);
    }
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms長押しでドラッグ開始（スクロールとの誤爆防止）
        tolerance: 5,
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

  const displayTasks = localTasks;

  return (
    <div className={cn("mb-4", variantStyles[variant])}>
      {!hideHeader && (
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
          {subtitle && (
            <span className="text-xs text-muted-foreground ml-1.5">
              — {subtitle}
            </span>
          )}
        </button>
      )}
      {(!isCollapsed || hideHeader) && (
        <div className="rounded-lg border border-border overflow-hidden bg-card">
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
                {displayTasks.map((task, index) => {
                  const isExiting = exitingIds.has(task.id);
                  return (
                    <div
                      key={task.id}
                      style={{
                        transition: "opacity 200ms ease",
                        opacity: isExiting ? 0 : 1,
                      }}
                    >
                      {index > 0 && <div className="border-t border-border" />}
                      <SortableTaskCard
                        task={task}
                        handlers={handlers}
                        showScheduledDate={showScheduledDate}
                        enableDragAndDrop={enableDragAndDrop}
                        matchReasons={matchReasonsMap[task.id]}
                      />
                    </div>
                  );
                })}
              </SortableContext>
            </DndContext>
          ) : (
            displayTasks.map((task, index) => {
              const isExiting = exitingIds.has(task.id);
              return (
                <div
                  key={task.id}
                  style={{
                    transition: "opacity 200ms ease",
                    opacity: isExiting ? 0 : 1,
                  }}
                >
                  {index > 0 && <div className="border-t border-border" />}
                  <TaskCard
                    task={task}
                    handlers={handlers}
                    showScheduledDate={showScheduledDate}
                    matchReasons={matchReasonsMap[task.id]}
                  />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
