"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, Tag } from "lucide-react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategorySelectModal } from "@/components/category";
import { DatePickerDialog } from "./date-picker-dialog";
import type { Category, Group } from "@/types";
import { cn } from "@/lib/utils";
import { formatRelativeScheduledDate } from "@/lib/dateUtils";
import { resizeTitle, resizeMemo } from "@/lib/textarea-resize";

export interface TaskCreateData {
  title: string;
  scheduledAt?: string;
  categoryId?: string;
  memo?: string;
}

interface TaskCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskCreateData) => void;
  categories?: Category[];
  groups?: Group[];
  defaultDate?: string;
  defaultCategoryId?: string | null;
  isLoading?: boolean;
}

export function TaskCreateModal({
  open,
  onOpenChange,
  onSubmit,
  categories = [],
  groups = [],
  defaultDate,
  defaultCategoryId,
  isLoading = false,
}: TaskCreateModalProps) {
  const getInitialCategoryId = (): string | null => {
    if (defaultCategoryId && defaultCategoryId !== "none") return defaultCategoryId;
    return null;
  };

  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState(defaultDate || "");
  const [categoryId, setCategoryId] = useState<string | null>(getInitialCategoryId());
  const [memo, setMemo] = useState("");
  const [categorySubOpen, setCategorySubOpen] = useState(false);
  const [dateSubOpen, setDateSubOpen] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const memoRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        titleRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isLoading) return;

    onSubmit({
      title: title.trim(),
      scheduledAt: scheduledAt || undefined,
      categoryId: categoryId ?? undefined,
      memo: memo.trim() || undefined,
    });

    setTitle("");
    setMemo("");
    onOpenChange(false);
  };

  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null;
  const categoryBgHex = selectedCategory?.group?.color ?? selectedCategory?.color;

  return (
    <>
      <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>タスクを追加</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>

          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.requestSubmit();
              }
            }}
            className="flex flex-col flex-1 min-h-0"
          >
            <ResponsiveDialogBody className="space-y-4">
              {/* タスク名 */}
              <div className="space-y-1.5">
                <Label>タスク名</Label>
                <Textarea
                  ref={titleRef}
                  value={title}
                  onChange={(e) => {
                    resizeTitle(e.target);
                    setTitle(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
                      e.preventDefault();
                      if (window.matchMedia("(pointer: coarse)").matches) {
                        e.currentTarget.form?.requestSubmit();
                      } else {
                        memoRef.current?.focus();
                      }
                    }
                  }}
                  rows={1}
                  placeholder="新しいタスクを入力..."
                  disabled={isLoading}
                  className="text-base resize-none overflow-hidden min-h-0"
                />
              </div>

              {/* メモ */}
              <div className="space-y-1.5">
                <Label>メモ</Label>
                <Textarea
                  ref={memoRef}
                  value={memo}
                  onChange={(e) => {
                    resizeMemo(e.target);
                    setMemo(e.target.value);
                  }}
                  rows={1}
                  placeholder="メモを入力..."
                  disabled={isLoading}
                  className="resize-none overflow-hidden"
                />
              </div>

              {/* Chips: カテゴリ・予定日 */}
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setCategorySubOpen(true)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors disabled:pointer-events-none disabled:opacity-40",
                    selectedCategory
                      ? "border-transparent hover:opacity-80"
                      : "border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                  )}
                  style={selectedCategory ? { backgroundColor: categoryBgHex ? `${categoryBgHex}26` : "hsl(var(--muted))" } : undefined}
                >
                  {selectedCategory ? (
                    <>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selectedCategory.color ?? "#6B7280" }} />
                      {selectedCategory.name}
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
                  disabled={isLoading}
                  onClick={() => setDateSubOpen(true)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors disabled:pointer-events-none disabled:opacity-40",
                    scheduledAt
                      ? "bg-muted border-transparent text-foreground hover:bg-muted/70"
                      : "border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {scheduledAt ? formatRelativeScheduledDate(scheduledAt) : "予定日なし"}
                </button>
              </div>
            </ResponsiveDialogBody>

            <ResponsiveDialogFooter>
              <Button type="submit" className="w-full sm:w-auto h-12 sm:h-9" disabled={!title.trim() || isLoading}>
                追加
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <CategorySelectModal
        open={categorySubOpen}
        onOpenChange={setCategorySubOpen}
        categories={categories}
        groups={groups}
        value={categoryId}
        onSelect={setCategoryId}
      />

      <DatePickerDialog
        open={dateSubOpen}
        onOpenChange={setDateSubOpen}
        value={scheduledAt || null}
        onChange={(date) => setScheduledAt(date ?? "")}
      />
    </>
  );
}
