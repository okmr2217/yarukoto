"use client";

import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateForDisplay, isTodayInJST } from "@/lib/dateUtils";
import Link from "next/link";

interface DateNavigationProps {
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  isPast?: boolean;
  isFuture?: boolean;
}

export function DateNavigation({
  currentDate,
  onPrevious,
  onNext,
  onToday,
  isPast = false,
  isFuture = false,
}: DateNavigationProps) {
  const isTodayDate = isTodayInJST(currentDate);

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
        <span className="text-sm font-medium">
          {formatDateForDisplay(currentDate)}
        </span>
        {isTodayDate && (
          <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
            今日
          </span>
        )}
        {isPast && (
          <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
            過去
          </span>
        )}
        {isFuture && (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
            未来
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onNext} aria-label="翌日">
          <ChevronRight className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="text-xs"
          disabled={isTodayDate}
        >
          今日
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="日付を選択"
          asChild
        >
          <Link href="/calendar">
            <Calendar className={cn("h-5 w-5")} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
