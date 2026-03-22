"use client";

import { useMemo } from "react";
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
import {
  Pencil,
  Ban,
  Trash2,
  MoreVertical,
  Info,
  GripVertical,
  Star,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  type LucideIcon,
} from "lucide-react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { getScheduledDateStatus, formatRelativeDate, formatRelativeScheduledDate } from "@/lib/dateUtils";

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
        <button
          onClick={actionHandlers.edit}
          className="hidden sm:flex p-1 rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label="編集"
        >
          <Pencil className="h-3.5 w-3.5" />
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
                className={cn(action.destructive ? "text-destructive" : "")}
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

const MATCH_REASON_CONFIG: Record<string, { Icon: LucideIcon; className: string }> = {
  この日に完了: { Icon: CheckCircle2, className: "bg-success/10 text-success text-xs px-2 py-0.5 rounded-full" },
  この日にやらない: { Icon: Ban, className: "bg-yellow-500/10 text-yellow-600 text-xs px-2 py-0.5 rounded-full" },
  この日に作成: { Icon: Clock, className: "text-muted-foreground text-xs" },
};

interface TaskCardMetaProps {
  task: Task;
  showScheduledDate: boolean;
  scheduledDateStatus: "today" | "overdue" | "future" | null;
  matchReasons?: string[];
  hasMemo: boolean;
}

function TaskCardMeta({ task, showScheduledDate, scheduledDateStatus, matchReasons, hasMemo }: TaskCardMetaProps) {
  const isSkipped = task.status === "SKIPPED";

  // "予定日" は scheduledDateStatus バッジで表示するため除外
  const contextReasons = matchReasons?.filter((r) => r !== "予定日") ?? [];

  const hasRow1 = (showScheduledDate && task.scheduledAt) || (isSkipped && task.skipReason) || !!task.category;
  const hasRow2 = contextReasons.length > 0;

  if (!hasRow1 && !hasRow2) return null;

  return (
    <div className={cn("flex flex-col gap-1", hasMemo ? "mt-2" : "mt-1")}>
      {hasRow1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {showScheduledDate && task.scheduledAt && (
            <>
              {scheduledDateStatus === "today" && (
                <span className="flex items-center gap-1 text-primary text-xs font-medium">
                  <Calendar className="h-3 w-3" />
                  今日
                </span>
              )}
              {scheduledDateStatus === "overdue" && (
                <span className="flex items-center gap-1 bg-destructive/10 text-destructive text-xs px-2 py-0.5 rounded-full font-medium">
                  <AlertCircle className="h-3 w-3" />
                  {formatRelativeScheduledDate(task.scheduledAt!)}
                </span>
              )}
              {scheduledDateStatus === "future" && (
                <span className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Calendar className="h-3 w-3" />
                  {formatRelativeScheduledDate(task.scheduledAt!)}
                </span>
              )}
            </>
          )}
          {task.category && task.category.color && (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: task.category.color }}
              title={task.category.name}
            />
          )}
          {isSkipped && task.skipReason && (
            <span className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 text-xs px-2 py-0.5 rounded-full">
              <Ban className="h-3 w-3" />
              {task.skipReason}
            </span>
          )}
        </div>
      )}
      {hasRow2 && (
        <div className="flex items-center gap-1.5 flex-wrap opacity-70">
          {contextReasons.map((reason) => {
            const config = MATCH_REASON_CONFIG[reason];
            if (!config) return <span key={reason} className="text-xs text-muted-foreground">{reason}</span>;
            return (
              <span key={reason} className={cn("flex items-center gap-1", config.className)}>
                <config.Icon className="h-3 w-3" />
                {reason}
              </span>
            );
          })}
        </div>
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
    <div className="flex group">
      {enableDragAndDrop && (
        <div
          className="flex items-center justify-center w-6 flex-shrink-0 bg-muted/50 cursor-grab active:cursor-grabbing touch-none text-muted-foreground/50"
          aria-label="ドラッグして並び替え"
          {...dragHandleListeners}
          {...dragHandleAttributes}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 p-3">
        <div className="flex items-start gap-3">
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
                <p className={cn("text-sm", (isCompleted || isSkipped) && "line-through text-muted-foreground")}>
                  {task.title}
                </p>
              </div>
              <span className="text-xs text-muted-foreground/50 flex-shrink-0 mt-0.5">{formatRelativeDate(task.createdAt)}</span>
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
    </div>
  );
}
