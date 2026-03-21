"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LinkText } from "@/components/ui/link-text";
import type { Task } from "@/types";
import { Pencil, Ban, Trash2, MoreVertical, Info, GripVertical, Star, type LucideIcon } from "lucide-react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { getScheduledDateStatus } from "@/lib/dateUtils";

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

function StopPropagation({ children }: { children: React.ReactNode }) {
  return (
    <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}

const ACTION_DEFINITIONS: Array<{
  key: "edit" | "detail" | "skip" | "delete";
  label: string;
  Icon: LucideIcon;
  className: string;
  destructive?: boolean;
}> = [
  { key: "edit", label: "編集", Icon: Pencil, className: "" },
  { key: "detail", label: "詳細", Icon: Info, className: "" },
  { key: "skip", label: "やらない", Icon: Ban, className: "hover:text-yellow-600" },
  { key: "delete", label: "削除", Icon: Trash2, className: "hover:text-destructive", destructive: true },
];

interface TaskCardActionsProps {
  task: Task;
  handlers: TaskCardHandlers;
}

function TaskCardActions({ task, handlers }: TaskCardActionsProps) {
  const actionHandlers: Record<"edit" | "detail" | "skip" | "delete", () => void> = {
    edit: () => handlers.onEdit(task),
    detail: () => handlers.onDetail(task.id),
    skip: () => handlers.onSkip(task.id),
    delete: () => handlers.onDelete(task.id),
  };

  return (
    <>
      <StopPropagation>
        <button
          onClick={() => handlers.onToggleFavorite(task.id)}
          className={cn(
            "p-1 rounded transition-colors",
            task.isFavorite ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500",
          )}
          aria-label={task.isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
        >
          <Star className="h-3.5 w-3.5" fill={task.isFavorite ? "currentColor" : "none"} />
        </button>
      </StopPropagation>
      <StopPropagation>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label="メニュー"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ACTION_DEFINITIONS.map((action) => (
              <DropdownMenuItem
                key={action.label}
                onClick={actionHandlers[action.key]}
                className={action.destructive ? "text-destructive" : ""}
              >
                <span className="mr-2">
                  <action.Icon className="h-4 w-4" />
                </span>
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </StopPropagation>
    </>
  );
}

interface TaskCardMetaProps {
  task: Task;
  showScheduledDate: boolean;
  scheduledDateStatus: "today" | "overdue" | "future" | null;
  matchReasons?: string[];
  hasMemo: boolean;
}

function TaskCardMeta({ task, showScheduledDate, scheduledDateStatus, matchReasons, hasMemo }: TaskCardMetaProps) {
  const isSkipped = task.status === "SKIPPED";
  const showMeta =
    (showScheduledDate && task.scheduledAt) || (isSkipped && task.skipReason) || (matchReasons && matchReasons.length > 0);

  if (!showMeta) return null;

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", hasMemo ? "mt-2" : "mt-1")}>
      {matchReasons && matchReasons.length > 0 &&
        matchReasons.map((reason) => (
          <span key={reason} className="text-xs text-muted-foreground">
            {reason}
          </span>
        ))}
      {showScheduledDate && task.scheduledAt && (
        <>
          {scheduledDateStatus === "today" && (
            <span className="text-xs text-primary font-medium">📅 今日</span>
          )}
          {scheduledDateStatus === "overdue" && (
            <span className="text-xs text-destructive font-medium">
              📅 期限超過 ({task.scheduledAt.replace(/-/g, "/")})
            </span>
          )}
          {scheduledDateStatus === "future" && (
            <span className="text-xs text-muted-foreground">📅 {task.scheduledAt.replace(/-/g, "/")}</span>
          )}
        </>
      )}
      {isSkipped && task.skipReason && (
        <span className="text-xs text-muted-foreground">理由: {task.skipReason}</span>
      )}
    </div>
  );
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
  const isCompleted = task.status === "COMPLETED";
  const isSkipped = task.status === "SKIPPED";
  const hasMemo = !!task.memo;

  const scheduledDateStatus = useMemo(() => getScheduledDateStatus(task.scheduledAt), [task.scheduledAt]);

  const handleCheckChange = (checked: boolean) => {
    if (checked) {
      handlers.onComplete(task.id);
    } else {
      handlers.onUncomplete(task.id);
    }
  };

  return (
    <div className="relative p-3">
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
        <StopPropagation>
          <Checkbox
            checked={isCompleted}
            onCheckedChange={handleCheckChange}
            disabled={isSkipped}
            className="mt-0.5"
          />
        </StopPropagation>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {task.category && task.category.color && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: task.category.color }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>{task.category.name}</TooltipContent>
                </Tooltip>
              )}
              <p className={cn("text-sm", (isCompleted || isSkipped) && "line-through text-muted-foreground")}>
                {task.title}
              </p>
            </div>
            <TaskCardActions task={task} handlers={handlers} />
          </div>

          {hasMemo && (
            <div className="text-xs text-muted-foreground whitespace-pre-wrap pb-1.5">
              <LinkText text={task.memo!} />
            </div>
          )}

          <TaskCardMeta
            task={task}
            showScheduledDate={showScheduledDate}
            scheduledDateStatus={scheduledDateStatus}
            matchReasons={matchReasons}
            hasMemo={hasMemo}
          />
        </div>
      </div>
    </div>
  );
}
