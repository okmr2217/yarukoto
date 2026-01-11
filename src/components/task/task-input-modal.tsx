"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, StickyNote } from "lucide-react";
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
import { getTodayInJST, addDaysJST } from "@/lib/dateUtils";
import type { Category } from "@/types";

const PRIORITIES = [
  { value: "none", label: "なし" },
  { value: "LOW", label: "低" },
  { value: "MEDIUM", label: "中" },
  { value: "HIGH", label: "高" },
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
  const [priority, setPriority] = useState<string>("none");
  const [memo, setMemo] = useState("");
  const [showMemo, setShowMemo] = useState(false);

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
      priority:
        priority !== "none"
          ? (priority as "HIGH" | "MEDIUM" | "LOW")
          : undefined,
      memo: memo.trim() || undefined,
    });

    // フォームをリセット
    setTitle("");
    setMemo("");
    setShowMemo(false);
    // 日付、カテゴリ、優先度は保持（連続入力用）
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

            {/* カテゴリ */}
            <div className="space-y-2">
              <label className="text-sm font-medium">カテゴリ</label>
              <div className="flex gap-1.5 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setCategoryId(undefined)}
                  className={cn(
                    "shrink-0 px-2.5 py-1.5 rounded-full text-xs border-2 transition-colors",
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
                      "shrink-0 px-2.5 py-1.5 rounded-full text-xs border-2 transition-colors flex items-center gap-1",
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

            {/* 優先度 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">優先度</label>
              <div className="grid grid-cols-4 gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      "h-8 rounded-md border text-sm font-medium transition-colors",
                      priority === p.value
                        ? p.value === "HIGH"
                          ? "bg-destructive text-destructive-foreground border-destructive"
                          : p.value === "MEDIUM"
                            ? "bg-yellow-500 text-white border-yellow-500"
                            : p.value === "LOW"
                              ? "bg-blue-500 text-white border-blue-500"
                              : "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-accent border-border"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* メモ */}
            {showMemo ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">メモ</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowMemo(false);
                      setMemo("");
                    }}
                  >
                    非表示
                  </Button>
                </div>
                <Textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="メモを入力..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setShowMemo(true)}
                className="w-full"
              >
                <StickyNote className="size-4" />
                メモを追加
              </Button>
            )}
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
