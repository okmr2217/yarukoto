"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Star, PlusCircle, CheckCircle2, Ban, PenLine, Trash2, Calendar, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategoryPickerDialog } from "./category-picker-dialog";
import { DatePickerDialog } from "./date-picker-dialog";
import { useTaskMutations } from "@/hooks/use-task-mutations";
import { useRecentCategories } from "@/hooks";
import type { Task, Category, Group } from "@/types";
import { formatDateTimeForDisplay, formatRelativeScheduledDate } from "@/lib/dateUtils";
import { resizeTitle, resizeMemo } from "@/lib/textarea-resize";

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onUncomplete: (id: string) => void;
  onSkip: (id: string) => void;
  onUnskip: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  categories: Category[];
  groups: Group[];
}

export function TaskDetailModal({
  task,
  open,
  onClose,
  onUncomplete,
  onSkip,
  onUnskip,
  onDelete,
  onToggleFavorite,
  categories,
  groups,
}: TaskDetailModalProps) {
  const [prevTaskId, setPrevTaskId] = useState<string | undefined>(task?.id);
  const [localTitle, setLocalTitle] = useState(task?.title ?? "");
  const [localMemo, setLocalMemo] = useState(task?.memo ?? "");
  const [categorySubOpen, setCategorySubOpen] = useState(false);
  const [dateSubOpen, setDateSubOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const memoRef = useRef<HTMLTextAreaElement>(null);

  const { updateTask } = useTaskMutations();
  const { getRecentIds } = useRecentCategories();
  const [recentIds] = useState(() => getRecentIds());

  // Sync local state when task changes (during-render pattern)
  if (prevTaskId !== task?.id) {
    setPrevTaskId(task?.id);
    setLocalTitle(task?.title ?? "");
    setLocalMemo(task?.memo ?? "");
  }

  // Auto-resize textareas when task or open state changes
  useEffect(() => {
    if (!open) return;

    const raf = requestAnimationFrame(() => {
      const titleEl = titleRef.current;
      if (titleEl) resizeTitle(titleEl);

      const memoEl = memoRef.current;
      if (memoEl) resizeMemo(memoEl);
    });

    return () => cancelAnimationFrame(raf);
  }, [task?.id, open]);

  const doSave = useCallback(
    (title: string, memo: string) => {
      if (!task) return;
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;
      updateTask.mutate({ id: task.id, title: trimmedTitle, memo: memo.trim() || null });
    },
    [task, updateTask],
  );

  const scheduleTextSave = useCallback(
    (title: string, memo: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSave(title, memo), 800);
    },
    [doSave],
  );

  const saveField = useCallback(
    (field: "categoryId" | "scheduledAt", value: string | null) => {
      if (!task) return;
      updateTask.mutate({ id: task.id, [field]: value });
    },
    [task, updateTask],
  );

  if (!task) return null;

  const isEditable = task.status === "PENDING";
  const isCompleted = task.status === "COMPLETED";
  const isSkipped = task.status === "SKIPPED";

  const categoryBgHex = task.category?.groupColor ?? task.category?.color;

  const timestamps = [
    { Icon: PlusCircle, label: "作成", value: task.createdAt, className: "text-muted-foreground/60" },
    ...(task.updatedAt !== task.createdAt
      ? [{ Icon: PenLine, label: "更新", value: task.updatedAt, className: "text-muted-foreground/60" }]
      : []),
    ...(isCompleted && task.completedAt ? [{ Icon: CheckCircle2, label: "完了", value: task.completedAt, className: "text-success" }] : []),
    ...(isSkipped && task.skippedAt ? [{ Icon: Ban, label: "やらない", value: task.skippedAt, className: "text-yellow-600" }] : []),
  ];

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            setCategorySubOpen(false);
            setDateSubOpen(false);
            onClose();
          }
        }}
      >
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>タスクの詳細</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <ResponsiveDialogDescription className="sr-only">タスクの詳細を確認・編集します。</ResponsiveDialogDescription>

          <ResponsiveDialogBody className="space-y-4">
            {/* Status banner */}
            {isCompleted && (
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                完了済み
              </div>
            )}
            {isSkipped && (
              <div className="flex items-center gap-2 text-yellow-600 text-sm">
                <Ban className="h-4 w-4 shrink-0" />
                やらない
              </div>
            )}

            {/* Disabled hint */}
            {!isEditable && (
              <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                🔒 {isCompleted ? "完了済みのタスク" : "「やらない」にしたタスク"}は編集できません
              </p>
            )}

            {/* タスク名 */}
            <div className="space-y-1.5">
              <Label>タスク名</Label>
              <Textarea
                ref={titleRef}
                value={localTitle}
                disabled={!isEditable}
                onChange={(e) => {
                  resizeTitle(e.target);
                  setLocalTitle(e.target.value);
                  scheduleTextSave(e.target.value, localMemo);
                }}
                rows={1}
                placeholder="タスクの内容"
                className="text-base resize-none overflow-hidden min-h-0"
              />
            </div>

            {/* メモ */}
            <div className="space-y-1.5">
              <Label>メモ</Label>
              <Textarea
                ref={memoRef}
                value={localMemo}
                disabled={!isEditable}
                onChange={(e) => {
                  resizeMemo(e.target);
                  setLocalMemo(e.target.value);
                  scheduleTextSave(localTitle, e.target.value);
                }}
                rows={1}
                placeholder="メモを入力..."
                className="resize-none overflow-hidden"
              />
            </div>

            {/* Chips: カテゴリ・予定日・お気に入り */}
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                disabled={!isEditable}
                onClick={() => setCategorySubOpen(true)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors disabled:pointer-events-none disabled:opacity-40",
                  task.category
                    ? "border-transparent hover:opacity-80"
                    : "border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                )}
                style={task.category ? { backgroundColor: categoryBgHex ? `${categoryBgHex}26` : "hsl(var(--muted))" } : undefined}
              >
                {task.category ? (
                  <>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.category.color ?? "#6B7280" }} />
                    {task.category.name}
                  </>
                ) : (
                  <>
                    <Tag className="h-3 w-3" />
                    カテゴリなし
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={!isEditable}
                onClick={() => setDateSubOpen(true)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors disabled:pointer-events-none disabled:opacity-40",
                  task.scheduledAt
                    ? "bg-muted border-transparent text-foreground hover:bg-muted/70"
                    : "border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                )}
              >
                <Calendar className="h-3 w-3" />
                {task.scheduledAt ? formatRelativeScheduledDate(task.scheduledAt) : "予定日なし"}
              </button>

              <button
                type="button"
                onClick={() => onToggleFavorite(task.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors",
                  task.isFavorite
                    ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 hover:bg-yellow-500/20"
                    : "border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                )}
              >
                <Star className="h-3 w-3" fill={task.isFavorite ? "currentColor" : "none"} />
                {task.isFavorite ? "お気に入り" : "お気に入りなし"}
              </button>
            </div>

            {/* Timestamps */}
            <div className="space-y-1.5">
              {timestamps.map(({ Icon, label, value, className }) => (
                <div key={label} className={cn("flex items-center gap-2 text-xs", className)}>
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="w-14 shrink-0 text-muted-foreground/60">{label}</span>
                  <span>{formatDateTimeForDisplay(new Date(value))}</span>
                </div>
              ))}
            </div>
          </ResponsiveDialogBody>

          <ResponsiveDialogFooter>
            <div className="flex gap-2 w-full">
              {!isCompleted && !isSkipped && (
                <button
                  type="button"
                  onClick={() => onSkip(task.id)}
                  className="h-10 px-3 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors shrink-0"
                >
                  <Ban size={14} />
                  やらない
                </button>
              )}
              {isCompleted && (
                <button
                  type="button"
                  onClick={() => onUncomplete(task.id)}
                  className="h-10 px-3 rounded-xl flex items-center justify-center text-sm font-medium border border-border hover:bg-muted transition-colors shrink-0"
                >
                  完了を取り消す
                </button>
              )}
              {isSkipped && (
                <button
                  type="button"
                  onClick={() => onUnskip(task.id)}
                  className="h-10 px-3 rounded-xl flex items-center justify-center text-sm font-medium border border-border hover:bg-muted transition-colors shrink-0"
                >
                  取り消す
                </button>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="h-10 px-3 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <CategoryPickerDialog
        open={categorySubOpen}
        onOpenChange={setCategorySubOpen}
        categories={categories}
        groups={groups}
        selectedCategoryId={task.categoryId}
        onChange={(id) => saveField("categoryId", id)}
        mode="edit"
        recentCategoryIds={recentIds}
      />

      <DatePickerDialog
        open={dateSubOpen}
        onOpenChange={setDateSubOpen}
        value={task.scheduledAt}
        onChange={(date) => saveField("scheduledAt", date)}
      />
    </>
  );
}
