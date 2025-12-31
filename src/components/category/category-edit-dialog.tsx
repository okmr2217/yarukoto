"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

// カラーパレット
const CATEGORY_COLORS = [
  { name: "赤", value: "#EF4444" },
  { name: "オレンジ", value: "#F97316" },
  { name: "黄", value: "#EAB308" },
  { name: "緑", value: "#22C55E" },
  { name: "青", value: "#3B82F6" },
  { name: "紫", value: "#A855F7" },
  { name: "グレー", value: "#6B7280" },
];

interface CategoryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSave: (data: { name: string; color: string }) => void;
  isLoading?: boolean;
}

export function CategoryEditDialog({
  open,
  onOpenChange,
  category,
  onSave,
  isLoading = false,
}: CategoryEditDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[4].value); // デフォルト: 青
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!category;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name);
        setColor(category.color || CATEGORY_COLORS[4].value);
      } else {
        setName("");
        setColor(CATEGORY_COLORS[4].value);
      }
      setError(null);
    }
  }, [open, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("カテゴリ名を入力してください");
      return;
    }

    if (trimmedName.length > 20) {
      setError("カテゴリ名は20文字以内で入力してください");
      return;
    }

    onSave({ name: trimmedName, color });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "カテゴリを編集" : "新しいカテゴリ"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* カテゴリ名 */}
          <div className="space-y-2">
            <Label htmlFor="category-name">カテゴリ名</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="例: 仕事"
              maxLength={20}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* カラー */}
          <div className="space-y-2">
            <Label>カラー</Label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "w-10 h-10 rounded-full border-2 transition-all",
                    color === c.value
                      ? "border-foreground scale-110"
                      : "border-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "保存中..." : "保存する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
