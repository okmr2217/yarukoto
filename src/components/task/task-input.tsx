"use client";

import { useState, useRef } from "react";
import { Calendar, Send, Tag, Zap, FileText, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

interface TaskInputProps {
  onSubmit: (data: TaskInputData) => void;
  categories?: Category[];
  defaultDate?: string;
  isLoading?: boolean;
  placeholder?: string;
}

export function TaskInput({
  onSubmit,
  categories = [],
  defaultDate,
  isLoading = false,
  placeholder = "新しいタスクを入力...",
}: TaskInputProps) {
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState(defaultDate || "");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [priority, setPriority] = useState<
    "HIGH" | "MEDIUM" | "LOW" | undefined
  >(undefined);
  const [memo, setMemo] = useState("");
  const [showMemo, setShowMemo] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

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

    // Reset form
    setTitle("");
    setMemo("");
    setShowMemo(false);
    // Keep date, category, priority for continuous input
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing && !showMemo) {
      handleSubmit(e);
    }
  };

  const handleDateClick = () => {
    dateInputRef.current?.showPicker();
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedPriority = PRIORITIES.find((p) => p.value === priority);

  const hasOptions = scheduledAt || categoryId || priority || memo;

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 bg-background border-t p-3"
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="pr-28"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {/* Date picker */}
            <button
              type="button"
              onClick={handleDateClick}
              className={cn(
                "p-1.5 rounded hover:bg-accent transition-colors",
                scheduledAt ? "text-primary" : "text-muted-foreground",
              )}
              aria-label="日付を選択"
            >
              <Calendar className="h-4 w-4" />
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="sr-only"
            />

            {/* Category picker */}
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "p-1.5 rounded hover:bg-accent transition-colors",
                    categoryId ? "text-primary" : "text-muted-foreground",
                  )}
                  style={
                    selectedCategory?.color
                      ? { color: selectedCategory.color }
                      : undefined
                  }
                  aria-label="カテゴリを選択"
                >
                  <Tag className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="end">
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryId(undefined);
                      setCategoryOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent",
                      !categoryId && "bg-accent",
                    )}
                  >
                    なし
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategoryId(cat.id);
                        setCategoryOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-2",
                        categoryId === cat.id && "bg-accent",
                      )}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color || "#6B7280" }}
                      />
                      {cat.name}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Priority picker */}
            <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "p-1.5 rounded hover:bg-accent transition-colors",
                    priority
                      ? selectedPriority?.color
                      : "text-muted-foreground",
                  )}
                  aria-label="優先度を選択"
                >
                  <Zap className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-32 p-1" align="end">
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPriority(undefined);
                      setPriorityOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent",
                      !priority && "bg-accent",
                    )}
                  >
                    なし
                  </button>
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => {
                        setPriority(p.value);
                        setPriorityOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent",
                        p.color,
                        priority === p.value && "bg-accent",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Memo toggle */}
            <button
              type="button"
              onClick={() => setShowMemo(!showMemo)}
              className={cn(
                "p-1.5 rounded hover:bg-accent transition-colors",
                showMemo || memo ? "text-primary" : "text-muted-foreground",
              )}
              aria-label="メモを追加"
            >
              <FileText className="h-4 w-4" />
            </button>
          </div>
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={!title.trim() || isLoading}
          aria-label="タスクを追加"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Memo textarea */}
      {showMemo && (
        <div className="mt-2">
          <Textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="メモを入力..."
            rows={2}
            className="resize-none"
          />
        </div>
      )}

      {/* Selected options display */}
      {hasOptions && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {scheduledAt && (
            <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
              📅 {scheduledAt.replace(/-/g, "/")}
              <button
                type="button"
                onClick={() => setScheduledAt("")}
                className="text-muted-foreground hover:text-foreground"
                aria-label="日付をクリア"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedCategory && (
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: selectedCategory.color
                  ? `${selectedCategory.color}20`
                  : undefined,
                color: selectedCategory.color || undefined,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: selectedCategory.color || "#6B7280",
                }}
              />
              {selectedCategory.name}
              <button
                type="button"
                onClick={() => setCategoryId(undefined)}
                className="opacity-70 hover:opacity-100"
                aria-label="カテゴリをクリア"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedPriority && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded",
                selectedPriority.color,
              )}
            >
              ⚡ {selectedPriority.label}
              <button
                type="button"
                onClick={() => setPriority(undefined)}
                className="opacity-70 hover:opacity-100"
                aria-label="優先度をクリア"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {memo && !showMemo && (
            <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
              <FileText className="h-3 w-3" />
              メモあり
              <button
                type="button"
                onClick={() => setMemo("")}
                className="opacity-70 hover:opacity-100"
                aria-label="メモをクリア"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </form>
  );
}
