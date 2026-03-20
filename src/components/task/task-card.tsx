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
import { LinkText } from "@/components/ui/link-text";
import type { Task } from "@/types";
import { Pencil, Ban, Trash2, MoreVertical, Info, GripVertical, Star } from "lucide-react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";

/**
 * タスクカードのアクションハンドラー
 */
export interface TaskCardHandlers {
  /** タスク詳細表示時のハンドラー */
  onDetail: (id: string) => void;
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
  /** お気に入りトグル時のハンドラー */
  onToggleFavorite: (id: string) => void;
}

interface TaskCardProps {
  /** 表示するタスク */
  task: Task;
  /** タスク操作のハンドラー群 */
  handlers: TaskCardHandlers;
  /** 予定日を表示するか（デフォルト: false） */
  showScheduledDate?: boolean;
  /** ドラッグ&ドロップを有効にするか */
  enableDragAndDrop?: boolean;
  /** ドラッグハンドル用のリスナー（dnd-kit） */
  dragHandleListeners?: DraggableSyntheticListeners;
  /** ドラッグハンドル用の属性（dnd-kit） */
  dragHandleAttributes?: DraggableAttributes;
  /** 日付フィルタ時のマッチ理由バッジ */
  matchReasons?: string[];
}

export function TaskCard({
  task,
  handlers,
  showScheduledDate = false,
  enableDragAndDrop = false,
  dragHandleListeners,
  dragHandleAttributes,
  matchReasons,
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

  const actions = [
    {
      label: "編集",
      icon: <Pencil className="h-4 w-4" />,
      iconSm: <Pencil className="h-3.5 w-3.5" />,
      onClick: () => handlers.onEdit(task),
      className: "",
    },
    {
      label: "詳細",
      icon: <Info className="h-4 w-4" />,
      iconSm: <Info className="h-3.5 w-3.5" />,
      onClick: () => handlers.onDetail(task.id),
      className: "",
    },
    {
      label: "やらない",
      icon: <Ban className="h-4 w-4" />,
      iconSm: <Ban className="h-3.5 w-3.5" />,
      onClick: () => handlers.onSkip(task.id),
      className: "hover:text-yellow-600",
    },
    {
      label: "削除",
      icon: <Trash2 className="h-4 w-4" />,
      iconSm: <Trash2 className="h-3.5 w-3.5" />,
      onClick: () => handlers.onDelete(task.id),
      className: "hover:text-destructive",
      destructive: true,
    },
  ];

  return (
    <div
      className="relative rounded-lg group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main card content */}
      <div className="relative bg-card border rounded-lg p-3">
        <div className="flex items-start gap-3">
          {enableDragAndDrop && (
            <button
              className="cursor-grab active:cursor-grabbing mt-0.5 text-muted-foreground hover:text-foreground touch-none flex-shrink-0"
              aria-label="ドラッグして並び替え"
              {...dragHandleListeners}
              {...dragHandleAttributes}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
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

              {/* Star favorite button (always visible) */}
              <div
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handlers.onToggleFavorite(task.id)}
                  className={cn(
                    "p-1 rounded transition-colors",
                    task.isFavorite
                      ? "text-yellow-500 hover:text-yellow-600"
                      : "text-muted-foreground hover:text-yellow-500",
                  )}
                  aria-label={task.isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
                >
                  <Star
                    className="h-3.5 w-3.5"
                    fill={task.isFavorite ? "currentColor" : "none"}
                  />
                </button>
              </div>

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
                    {actions.map((action) => (
                      <DropdownMenuItem
                        key={action.label}
                        onClick={action.onClick}
                        className={action.destructive ? "text-destructive" : ""}
                      >
                        <span className="mr-2">{action.icon}</span>
                        {action.label}
                      </DropdownMenuItem>
                    ))}
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
                {actions.map((action) => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className={cn(
                      "p-1.5 rounded hover:bg-accent text-muted-foreground transition-colors",
                      action.className,
                    )}
                    aria-label={action.label}
                  >
                    {action.iconSm}
                  </button>
                ))}
              </div>
            </div>

            {/* Memo content (always shown) */}
            {hasMemo && (
              <div className="text-xs text-muted-foreground whitespace-pre-wrap pb-1.5">
                <LinkText text={task.memo!} />
              </div>
            )}

            {((showScheduledDate && task.scheduledAt) ||
              task.category ||
              (isSkipped && task.skipReason) ||
              (matchReasons && matchReasons.length > 0)) && (
              <div
                className={cn(
                  "flex items-center gap-2 flex-wrap",
                  hasMemo && "mt-2",
                  !hasMemo && "mt-1",
                )}
              >
                {matchReasons && matchReasons.length > 0 && matchReasons.map((reason) => (
                  <span key={reason} className="text-xs text-muted-foreground">
                    {reason}
                  </span>
                ))}
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
