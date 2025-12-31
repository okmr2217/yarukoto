"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TaskCard } from "./task-card";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  defaultCollapsed?: boolean;
  variant?: "default" | "completed" | "skipped" | "overdue";
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
  showScheduledDate?: boolean;
}

const variantStyles = {
  default: "",
  completed: "opacity-70",
  skipped: "opacity-70",
  overdue: "",
};

const titleStyles = {
  default: "text-foreground",
  completed: "text-success",
  skipped: "text-muted-foreground",
  overdue: "text-destructive",
};

export function TaskSection({
  title,
  tasks,
  defaultCollapsed = false,
  variant = "default",
  onComplete,
  onUncomplete,
  onEdit,
  onSkip,
  onDelete,
  showScheduledDate = false,
}: TaskSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (tasks.length === 0) return null;

  return (
    <div className={cn("mb-4", variantStyles[variant])}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-1 w-full py-2 text-left"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
        <span className={cn("text-sm font-medium", titleStyles[variant])}>
          {title}
        </span>
        <span className="text-xs text-muted-foreground ml-1">
          ({tasks.length})
        </span>
      </button>
      {!isCollapsed && (
        <div className="space-y-2 mt-1">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={onComplete}
              onUncomplete={onUncomplete}
              onEdit={onEdit}
              onSkip={onSkip}
              onDelete={onDelete}
              showScheduledDate={showScheduledDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
