"use client";

import { useState, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import { Pencil, Ban, Trash2, ChevronDown, FileText } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
  showScheduledDate?: boolean;
}

const priorityLabels: Record<string, { label: string; className: string }> = {
  HIGH: { label: "高", className: "text-destructive" },
  MEDIUM: { label: "中", className: "text-warning" },
  LOW: { label: "低", className: "text-muted-foreground" },
};

export function TaskCard({
  task,
  onComplete,
  onUncomplete,
  onEdit,
  onSkip,
  onDelete,
  showScheduledDate = false,
}: TaskCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startXRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const isCompleted = task.status === "COMPLETED";
  const isSkipped = task.status === "SKIPPED";
  const hasMemo = !!task.memo;

  const handleCheckChange = (checked: boolean) => {
    if (checked) {
      onComplete(task.id);
    } else {
      onUncomplete(task.id);
    }
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const diff = startXRef.current - e.touches[0].clientX;
    // Only allow left swipe (positive diff), max 150px
    const offset = Math.min(Math.max(diff, 0), 150);
    setSwipeOffset(offset);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    // Snap to open (120px) or closed (0)
    if (swipeOffset > 60) {
      setSwipeOffset(120);
    } else {
      setSwipeOffset(0);
    }
  };

  const closeSwipe = () => setSwipeOffset(0);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on checkbox or buttons
    if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) {
      return;
    }
    if (hasMemo) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-lg group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Swipe action buttons (mobile) */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
        <button
          onClick={() => {
            closeSwipe();
            onEdit(task);
          }}
          className="w-10 flex items-center justify-center bg-blue-500 text-white"
          aria-label="編集"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            closeSwipe();
            onSkip(task.id);
          }}
          className="w-10 flex items-center justify-center bg-yellow-500 text-white"
          aria-label="やらない"
        >
          <Ban className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            closeSwipe();
            onDelete(task.id);
          }}
          className="w-10 flex items-center justify-center bg-destructive text-white"
          aria-label="削除"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Main card content */}
      <div
        ref={cardRef}
        className={cn(
          "relative bg-card border rounded-lg p-3 transition-transform",
          !isSwiping && "transition-transform duration-200",
          hasMemo && "cursor-pointer",
        )}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={handleCheckChange}
            disabled={isSkipped}
            className="mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p
                className={cn(
                  "text-sm flex-1",
                  (isCompleted || isSkipped) &&
                    "line-through text-muted-foreground",
                )}
              >
                {task.title}
              </p>

              {/* Hover action buttons (PC) */}
              <div
                className={cn(
                  "flex items-center gap-1 transition-opacity",
                  isHovered ? "opacity-100" : "opacity-0 pointer-events-none",
                  "hidden sm:flex",
                )}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="編集"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSkip(task.id);
                  }}
                  className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-yellow-600 transition-colors"
                  aria-label="やらない"
                >
                  <Ban className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="削除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Memo indicator / expand button */}
              {hasMemo && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className={cn(
                    "p-1 rounded text-muted-foreground hover:text-foreground transition-all sm:hidden",
                    isExpanded && "rotate-180",
                  )}
                  aria-label={isExpanded ? "メモを閉じる" : "メモを表示"}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {showScheduledDate && task.scheduledAt && (
                <span className="text-xs text-muted-foreground">
                  📅 {task.scheduledAt.replace(/-/g, "/")}
                </span>
              )}
              {task.category && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: task.category.color
                      ? `${task.category.color}20`
                      : undefined,
                    color: task.category.color || undefined,
                  }}
                >
                  🏷️ {task.category.name}
                </span>
              )}
              {task.priority && priorityLabels[task.priority] && (
                <span
                  className={cn(
                    "text-xs",
                    priorityLabels[task.priority].className,
                  )}
                >
                  ⚡ {priorityLabels[task.priority].label}
                </span>
              )}
              {hasMemo && !isExpanded && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <FileText className="h-3 w-3" />
                  メモあり
                </span>
              )}
              {isSkipped && task.skipReason && (
                <span className="text-xs text-muted-foreground">
                  理由: {task.skipReason}
                </span>
              )}
            </div>

            {/* Expanded memo */}
            {hasMemo && isExpanded && (
              <div className="mt-2 p-2 bg-muted/50 rounded text-sm text-muted-foreground whitespace-pre-wrap">
                {task.memo}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
