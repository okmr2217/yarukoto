"use client";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>予定日</DialogTitle>
          <DialogDescription className="sr-only">予定日を選択してください。</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-1.5 pt-2">
          <Button type="button" size="sm" variant={!value ? "default" : "outline"} onClick={() => onChange(null)}>
            なし
          </Button>
          <Button type="button" size="sm" variant={value === todayString ? "default" : "outline"} onClick={() => onChange(todayString)}>
            今日
          </Button>
          <Button type="button" size="sm" variant={value === tomorrowString ? "default" : "outline"} onClick={() => onChange(tomorrowString)}>
            明日
          </Button>
        </div>
        <input
          type="date"
          value={value ?? ""}
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </DialogContent>
    </Dialog>
  );
}
