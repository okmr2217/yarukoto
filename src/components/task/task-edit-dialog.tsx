"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Task, Category } from "@/types";

export interface TaskEditData {
  id: string;
  title: string;
  scheduledAt?: string | null;
  categoryId?: string | null;
  memo?: string | null;
}

interface TaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TaskEditData) => void;
  task: Task | null;
  categories: Category[];
}

export function TaskEditDialog({
  open,
  onOpenChange,
  onSave,
  task,
  categories,
}: TaskEditDialogProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [scheduledAt, setScheduledAt] = useState(task?.scheduledAt ?? "");
  const [categoryId, setCategoryId] = useState<string>(task?.categoryId ?? "none");
  const [memo, setMemo] = useState(task?.memo ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("タスク名を入力してください");
      return;
    }

    if (!task) return;

    onSave({
      id: task.id,
      title: trimmedTitle,
      scheduledAt: scheduledAt || null,
      categoryId: categoryId !== "none" ? categoryId : null,
      memo: memo.trim() || null,
    });
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle>タスクを編集</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* タスク名 */}
          <div className="space-y-2">
            <Label htmlFor="edit-task-title">
              タスク名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-task-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder="タスクの内容"
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* 予定日 */}
          <div className="space-y-2">
            <Label htmlFor="edit-task-date">予定日</Label>
            <div className="flex gap-2">
              <Input
                id="edit-task-date"
                type="date"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="flex-1"
              />
              {scheduledAt && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScheduledAt("")}
                >
                  クリア
                </Button>
              )}
            </div>
          </div>

          {/* カテゴリ */}
          <div className="space-y-2">
            <Label>カテゴリ</Label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setCategoryId("none")}
                className={cn(
                  "px-2.5 py-1.5 rounded-full text-xs border-2 transition-colors",
                  categoryId === "none"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-accent",
                )}
              >
                なし
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-full text-xs border-2 transition-colors flex items-center gap-1",
                    categoryId === cat.id
                      ? "border-primary"
                      : "border-border hover:bg-accent",
                  )}
                  style={{
                    backgroundColor:
                      categoryId === cat.id && cat.color
                        ? `${cat.color}20`
                        : undefined,
                    borderColor:
                      categoryId === cat.id && cat.color
                        ? cat.color
                        : undefined,
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color || "#6B7280" }}
                  />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* メモ */}
          <div className="space-y-2">
            <Label htmlFor="edit-task-memo">メモ</Label>
            <Textarea
              id="edit-task-memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="タスクの詳細やメモ"
              rows={3}
            />
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit">保存する</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
