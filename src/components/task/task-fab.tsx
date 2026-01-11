"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TaskFabProps {
  onClick: () => void;
  className?: string;
}

export function TaskFab({ onClick, className }: TaskFabProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
        "hover:scale-110 transition-transform",
        className,
      )}
      aria-label="タスクを追加"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
