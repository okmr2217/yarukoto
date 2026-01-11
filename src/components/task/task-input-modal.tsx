"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

const PRIORITIES = [
  { value: "HIGH", label: "高", color: "text-destructive" },
  { value: "MEDIUM", label: "中", color: "text-yellow-600" },
  { value: "LOW", label: "低", color: "text-blue-500" },
] as const;

export interface TaskInputData {
  title: string;
  scheduledAt?: string;
  categoryId?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  memo?: string;
}

interface TaskInputModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskInputData) => void;
  categories?: Category[];
  defaultDate?: string;
  defaultCategoryId?: string | null;
  isLoading?: boolean;
}

export function TaskInputModal({
  open,
  onOpenChange,
  onSubmit,
  categories = [],
  defaultDate,
  defaultCategoryId,
  isLoading = false,
}: TaskInputModalProps) {
  // defaultCategoryIdから初期値を計算
  const getInitialCategoryId = () => {
    if (defaultCategoryId && defaultCategoryId !== "none") {
      return defaultCategoryId;
    }
    return undefined;
  };

  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState(defaultDate || "");
  const [categoryId, setCategoryId] = useState<string | undefined>(
    getInitialCategoryId()
  );
  const [priority, setPriority] = useState<
    "HIGH" | "MEDIUM" | "LOW" | undefined
  >(undefined);
  const [memo, setMemo] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // モーダルが開いたときにタイトル入力にフォーカス
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
      // モーダルを開いた時にカテゴリをリセット
      setCategoryId(getInitialCategoryId());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isLoading) return;

    onSubmit({
      title: title.trim(),
      scheduledAt: scheduledAt || undefined,
      categoryId: categoryId || undefined,
      priority: priority || undefined,
      memo: memo.trim() || undefined,
    });

    // フォームをリセット
    setTitle("");
    setMemo("");
    // 日付、カテゴリ、優先度は保持（連続入力用）
    onOpenChange(false);
  };

  const handleDateSelect = (type: "none" | "today" | "tomorrow" | "custom") => {
    const today = new Date();
    const jstOffset = 9 * 60; // JST is UTC+9
    const jstDate = new Date(today.getTime() + jstOffset * 60 * 1000);

    if (type === "none") {
      setScheduledAt("");
    } else if (type === "today") {
      setScheduledAt(jstDate.toISOString().split("T")[0]);
    } else if (type === "tomorrow") {
      const tomorrow = new Date(jstDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledAt(tomorrow.toISOString().split("T")[0]);
    } else if (type === "custom") {
      dateInputRef.current?.showPicker();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle>タスクを追加</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="overflow-y-auto px-4 py-6 space-y-6">
            {/* タスク名 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">タスク名</label>
              <Input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="新しいタスクを入力..."
                disabled={isLoading}
                className="text-base"
              />
            </div>

            {/* 予定日 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">予定日</label>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  type="button"
                  variant={!scheduledAt ? "default" : "outline"}
                  onClick={() => handleDateSelect("none")}
                  className="h-10"
                >
                  なし
                </Button>
                <Button
                  type="button"
                  variant={
                    scheduledAt ===
                    new Date(
                      new Date().getTime() + 9 * 60 * 60 * 1000,
                    )
                      .toISOString()
                      .split("T")[0]
                      ? "default"
                      : "outline"
                  }
                  onClick={() => handleDateSelect("today")}
                  className="h-10"
                >
                  今日
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDateSelect("tomorrow")}
                  className="h-10"
                >
                  明日
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDateSelect("custom")}
                  className="h-10 flex items-center gap-1"
                >
                  <Calendar className="h-4 w-4" />
                  選択
                </Button>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="sr-only"
                />
              </div>
              {scheduledAt && (
                <p className="text-xs text-muted-foreground">
                  選択中: {scheduledAt.replace(/-/g, "/")}
                </p>
              )}
            </div>

            {/* カテゴリ */}
            <div className="space-y-2">
              <label className="text-sm font-medium">カテゴリ</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setCategoryId(undefined)}
                  className={cn(
                    "flex-shrink-0 px-3 py-2 rounded-full text-sm border-2 transition-colors",
                    !categoryId
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
                      "flex-shrink-0 px-3 py-2 rounded-full text-sm border-2 transition-colors flex items-center gap-1.5",
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
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color || "#6B7280" }}
                    />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 優先度 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">優先度</label>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  type="button"
                  variant={!priority ? "default" : "outline"}
                  onClick={() => setPriority(undefined)}
                  className="h-10"
                >
                  なし
                </Button>
                {PRIORITIES.map((p) => (
                  <Button
                    key={p.value}
                    type="button"
                    variant={priority === p.value ? "default" : "outline"}
                    onClick={() => setPriority(p.value)}
                    className={cn("h-10", priority === p.value && p.color)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* メモ */}
            <div className="space-y-2">
              <label className="text-sm font-medium">メモ</label>
              <Textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="メモを入力..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* フッター */}
          <div className="border-t p-4">
            <Button
              type="submit"
              className="w-full h-12"
              disabled={!title.trim() || isLoading}
            >
              追加
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
