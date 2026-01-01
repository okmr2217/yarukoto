"use client";

import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateForDisplay } from "@/lib/dateUtils";

interface DateNavigationProps {
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onDatePicker: () => void;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function DateNavigation({
  currentDate,
  onPrevious,
  onNext,
  onToday,
  onDatePicker,
}: DateNavigationProps) {
  const isTodayDate = isToday(currentDate);

  return (
    <div className="flex items-center justify-between px-2 py-2 bg-muted/30">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        aria-label="前日"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{formatDateForDisplay(currentDate)}</span>
        {isTodayDate && (
          <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
            今日
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onNext} aria-label="翌日">
          <ChevronRight className="h-5 w-5" />
        </Button>
        {!isTodayDate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            className="text-xs"
          >
            今日
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDatePicker}
          aria-label="日付を選択"
        >
          <Calendar className={cn("h-5 w-5")} />
        </Button>
      </div>
    </div>
  );
}
