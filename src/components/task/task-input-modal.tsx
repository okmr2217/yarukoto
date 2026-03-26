"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getTodayInJST, addDaysJST } from "@/lib/dateUtils";
import type { Category } from "@/types";

export interface TaskInputData {
  title: string;
  scheduledAt?: string;
  categoryId?: string;
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
    getInitialCategoryId(),
  );
  const [memo, setMemo] = useState("");

  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // モーダルが開いたときにタイトル入力にフォーカス
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isLoading) return;

    onSubmit({
      title: title.trim(),
      scheduledAt: scheduledAt || undefined,
      categoryId: categoryId || undefined,
      memo: memo.trim() || undefined,
    });

    // フォームをリセット
    setTitle("");
    setMemo("");
    // カテゴリは保持（連続入力用）
    // 日付は次回モーダルを開いたときにdefaultDateでリセットされる
    onOpenChange(false);
  };

  const todayString = getTodayInJST();
  const tomorrowString = addDaysJST(todayString, 1);

  const handleDateSelect = (type: "none" | "today" | "tomorrow" | "custom") => {
    if (type === "none") {
      setScheduledAt("");
    } else if (type === "today") {
      setScheduledAt(todayString);
    } else if (type === "tomorrow") {
      setScheduledAt(tomorrowString);
    } else if (type === "custom") {
      dateInputRef.current?.showPicker();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] p-0 gap-0 max-sm:top-4 max-sm:translate-y-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle>タスクを追加</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="overflow-y-auto p-4 space-y-5">
            {/* タスク名 */}
            <div>
              <label className="text-sm font-medium block mb-1">タスク名</label>
              <Textarea
                ref={titleInputRef}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="新しいタスクを入力..."
                disabled={isLoading}
                rows={1}
                className="text-base resize-none overflow-hidden min-h-0"
              />
            </div>

            {/* カテゴリ */}
            <div>
              <label className="text-sm font-medium block mb-1">カテゴリ</label>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setCategoryId(undefined)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs border-2 transition-colors",
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
                      "px-2.5 py-1 rounded-full text-xs border-2 transition-colors flex items-center gap-1",
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
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color || "#6B7280" }}
                    />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* メモ */}
            <div>
              <label className="text-sm font-medium block mb-1">メモ</label>
              <Textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="メモを入力..."
                rows={3}
                className="resize-none overflow-y-auto max-h-32"
              />
            </div>

            {/* 予定日 */}
            <div>
              <label className="text-sm font-medium block mb-1">予定日</label>
              <div className="grid grid-cols-4 gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={!scheduledAt ? "default" : "outline"}
                  onClick={() => handleDateSelect("none")}
                >
                  なし
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={scheduledAt === todayString ? "default" : "outline"}
                  onClick={() => handleDateSelect("today")}
                >
                  今日
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={
                    scheduledAt === tomorrowString ? "default" : "outline"
                  }
                  onClick={() => handleDateSelect("tomorrow")}
                >
                  明日
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleDateSelect("custom")}
                >
                  <Calendar className="size-4" />
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
