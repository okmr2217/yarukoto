"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface SkipReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  onConfirm: (reason?: string) => void;
  isLoading?: boolean;
}

export function SkipReasonDialog({
  open,
  onOpenChange,
  taskTitle,
  onConfirm,
  isLoading = false,
}: SkipReasonDialogProps) {
  const [reason, setReason] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setReason("");
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>やらないにする</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            「<span className="font-medium text-foreground">{taskTitle}</span>
            」をやらないにしますか？
          </p>

          <div className="space-y-2">
            <Label htmlFor="skip-reason">理由（任意）</Label>
            <Textarea
              id="skip-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="やらない理由を入力..."
              rows={3}
              maxLength={1000}
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-right">
              {reason.length}/1000
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            キャンセル
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "処理中..." : "やらないにする"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
