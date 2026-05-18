"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getTodayInJST, addDaysJST } from "@/lib/dateUtils";

interface DatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string | null;
  onChange: (date: string | null) => void;
}

export function DatePickerDialog({ open, onOpenChange, value, onChange }: DatePickerDialogProps) {
  const todayString = getTodayInJST();
  const tomorrowString = addDaysJST(todayString, 1);

  const [prevOpen, setPrevOpen] = useState(open);
  const [inputValue, setInputValue] = useState(value ?? "");

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setInputValue(value ?? "");
  }

  const handleSelect = (date: string | null) => {
    onChange(date);
    onOpenChange(false);
  };

  const isCustomDate = !!inputValue && inputValue !== todayString && inputValue !== tomorrowString;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>予定日</DialogTitle>
          <DialogDescription className="sr-only">予定日を選択してください。</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-1.5 pt-2">
          <Button type="button" size="sm" variant={value === todayString ? "default" : "outline"} disabled={isCustomDate} onClick={() => handleSelect(todayString)}>
            今日
          </Button>
          <Button type="button" size="sm" variant={value === tomorrowString ? "default" : "outline"} disabled={isCustomDate} onClick={() => handleSelect(tomorrowString)}>
            明日
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isCustomDate ? "default" : "outline"}
            disabled={!isCustomDate}
            onClick={() => handleSelect(inputValue)}
          >
            選択
          </Button>
        </div>
        <input
          type="date"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => handleSelect(null)}>
          クリア
        </Button>
      </DialogContent>
    </Dialog>
  );
}
