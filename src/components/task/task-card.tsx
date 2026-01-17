"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import {
  Pencil,
  Ban,
  Trash2,
  MoreVertical,
} from "lucide-react";

/**
 * タスクカードのアクションハンドラー
 */
export interface TaskCardHandlers {
  /** タスク完了時のハンドラー */
  onComplete: (id: string) => void;
  /** タスク完了取り消し時のハンドラー */
  onUncomplete: (id: string) => void;
  /** タスク編集時のハンドラー */
  onEdit: (task: Task) => void;
  /** タスクスキップ時のハンドラー */
  onSkip: (id: string) => void;
  /** タスク削除時のハンドラー */
  onDelete: (id: string) => void;
}

interface TaskCardProps {
  /** 表示するタスク */
  task: Task;
  /** タスク操作のハンドラー群 */
  handlers: TaskCardHandlers;
  /** 予定日を表示するか（デフォルト: false） */
  showScheduledDate?: boolean;
}

const priorityLabels: Record<string, { label: string; className: string }> = {
  HIGH: { label: "高", className: "text-destructive" },
  MEDIUM: { label: "中", className: "text-warning" },
  LOW: { label: "低", className: "text-muted-foreground" },
};

export function TaskCard({
  task,
  handlers,
  showScheduledDate = false,
}: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isCompleted = task.status === "COMPLETED";
  const isSkipped = task.status === "SKIPPED";
  const hasMemo = !!task.memo;

  // 予定日の状態を判定
  const getScheduledDateStatus = () => {
    if (!task.scheduledAt) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scheduledDate = new Date(task.scheduledAt);
    scheduledDate.setHours(0, 0, 0, 0);

    if (scheduledDate.getTime() === today.getTime()) {
      return "today";
    } else if (scheduledDate < today) {
      return "overdue";
    } else {
      return "future";
    }
  };

  const scheduledDateStatus = getScheduledDateStatus();

  const handleCheckChange = (checked: boolean) => {
    if (checked) {
      handlers.onComplete(task.id);
    } else {
      handlers.onUncomplete(task.id);
    }
  };


  return (
    <div
      className="relative rounded-lg group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main card content */}
      <div
        className="relative bg-card border rounded-lg p-3"
      >
        <div className="flex items-start gap-3">
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleCheckChange}
              disabled={isSkipped}
              className="mt-0.5"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p
                className={cn(
                  "text-sm flex-1",
                  (isCompleted || isSkipped) &&
                    "line-through text-muted-foreground",
                )}
              >
                {task.title}
              </p>

              {/* Three-dot menu (mobile) */}
              <div
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors sm:hidden"
                      aria-label="メニュー"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        handlers.onEdit(task);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      編集
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        handlers.onSkip(task.id);
                      }}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      やらない
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        handlers.onDelete(task.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Hover action buttons (PC) */}
              <div
                className={cn(
                  "flex items-center gap-1 transition-opacity",
                  isHovered ? "opacity-100" : "opacity-0 pointer-events-none",
                  "hidden sm:flex",
                )}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    handlers.onEdit(task);
                  }}
                  className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="編集"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    handlers.onSkip(task.id);
                  }}
                  className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-yellow-600 transition-colors"
                  aria-label="やらない"
                >
                  <Ban className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    handlers.onDelete(task.id);
                  }}
                  className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="削除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Memo content (always shown) */}
            {hasMemo && (
              <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                {task.memo}
              </div>
            )}

            {((showScheduledDate && task.scheduledAt) || task.category || task.priority || (isSkipped && task.skipReason)) && (
              <div className={cn(
                "flex items-center gap-2 flex-wrap",
                hasMemo && "mt-2",
                !hasMemo && "mt-1"
              )}>
                {showScheduledDate && task.scheduledAt && (
                  <>
                    {scheduledDateStatus === "today" && (
                      <span className="text-xs text-primary font-medium">
                        📅 今日
                      </span>
                    )}
                    {scheduledDateStatus === "overdue" && (
                      <span className="text-xs text-destructive font-medium">
                        📅 期限超過 ({task.scheduledAt.replace(/-/g, "/")})
                      </span>
                    )}
                    {scheduledDateStatus === "future" && (
                      <span className="text-xs text-muted-foreground">
                        📅 {task.scheduledAt.replace(/-/g, "/")}
                      </span>
                    )}
                  </>
                )}
                {task.category && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: task.category.color
                        ? `${task.category.color}20`
                        : undefined,
                      color: task.category.color || undefined,
                    }}
                  >
                    🏷️ {task.category.name}
                  </span>
                )}
                {task.priority && priorityLabels[task.priority] && (
                  <span
                    className={cn(
                      "text-xs",
                      priorityLabels[task.priority].className,
                    )}
                  >
                    ⚡ {priorityLabels[task.priority].label}
                  </span>
                )}
                {isSkipped && task.skipReason && (
                  <span className="text-xs text-muted-foreground">
                    理由: {task.skipReason}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
