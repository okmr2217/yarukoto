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
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
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
  Undo2,
  type LucideIcon,
} from "lucide-react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { getScheduledDateStatus, formatCompactTime, formatRelativeScheduledDate } from "@/lib/dateUtils";

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
  /** タスクスキップ取り消し時のハンドラー */
  onUnskip: (id: string) => void;
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

const DEFAULT_ACTIONS: Array<{
  key: "edit" | "detail" | "skip" | "unskip" | "delete";
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

const SKIPPED_ACTIONS: typeof DEFAULT_ACTIONS = [
  { key: "edit", label: "編集", Icon: Pencil, className: "" },
  { key: "detail", label: "詳細", Icon: Info, className: "" },
  { key: "unskip", label: "やらないを取り消す", Icon: Undo2, className: "hover:text-foreground" },
  { key: "delete", label: "削除", Icon: Trash2, className: "hover:text-destructive", destructive: true },
];

interface TaskCardActionsProps {
  task: Task;
  handlers: TaskCardHandlers;
}

function TaskCardActions({ task, handlers }: TaskCardActionsProps) {
  const isSkipped = task.status === "SKIPPED";
  const actionHandlers: Record<"edit" | "detail" | "skip" | "unskip" | "delete", () => void> = {
    edit: () => handlers.onEdit(task),
    detail: () => handlers.onDetail(task.id),
    skip: () => handlers.onSkip(task.id),
    unskip: () => handlers.onUnskip(task.id),
    delete: () => handlers.onDelete(task.id),
  };
  const actions = isSkipped ? SKIPPED_ACTIONS : DEFAULT_ACTIONS;

  return (
    <div className="flex items-center gap-0.5">
      <StopPropagation>
        <button
          onClick={() => handlers.onToggleFavorite(task.id)}
          className={cn(
            "p-1.5 rounded transition-colors hover:bg-accent",
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
          className="hidden sm:flex p-1.5 rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label="編集"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </StopPropagation>
      <StopPropagation>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1.5 rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
              aria-label="メニュー"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions.map((action) => (
              <DropdownMenuItem
                key={action.key}
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
    </div>
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

  // カテゴリドットは上段に移動したためここでは除外
  const hasRow1 = (showScheduledDate && task.scheduledAt) || (isSkipped && task.skipReason);
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

  const timeEntries = useMemo(() => {
    const entries = [{ Icon: Clock, timestamp: task.createdAt, className: "text-muted-foreground/50" }];
    if (isCompleted && task.completedAt) {
      entries.push({ Icon: CheckCircle2, timestamp: task.completedAt, className: "text-success" });
    }
    if (isSkipped && task.skippedAt) {
      entries.push({ Icon: Ban, timestamp: task.skippedAt, className: "text-yellow-600" });
    }
    return entries;
  }, [isCompleted, isSkipped, task.completedAt, task.skippedAt, task.createdAt]);

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
      <div className="flex-1 px-3 py-1.5">
        {/* 上段：チェックボックス・時間・アクション */}
        <div className="flex items-center gap-2">
          <StopPropagation>
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleCheckChange}
              disabled={isSkipped}
            />
          </StopPropagation>
          <div className="flex items-center gap-2 flex-wrap">
            {timeEntries.map((entry, i) => (
              <span key={i} className={cn("flex items-center gap-0.75 text-xs", entry.className)}>
                <entry.Icon className="h-3 w-3 translate-y-[0.25px]" />
                {formatCompactTime(entry.timestamp)}
              </span>
            ))}
          </div>
          <div className="flex-1" />
          <TaskCardActions task={task} handlers={handlers} />
        </div>

        {/* 区切り線 */}
        <div className="border-t border-border/40 my-0.5" />

        {/* 下段：タスク名・メモ・メタ情報 */}
        <div className="pl-6 pt-1 pb-0.5">
          <div className="flex items-start gap-1.5">
            {task.category?.color && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-1.75 cursor-default"
                    style={{ backgroundColor: task.category.color }}
                  />
                </TooltipTrigger>
                <TooltipContent>{task.category.name}</TooltipContent>
              </Tooltip>
            )}
            <p className={cn("text-sm font-medium", (isCompleted || isSkipped) && "text-muted-foreground")}>
              {task.title}
            </p>
          </div>

          {hasMemo && (
            <div className="text-xs text-muted-foreground whitespace-pre-wrap mt-1.5">
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
