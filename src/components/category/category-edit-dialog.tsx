"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

// カラーパレット
const CATEGORY_COLORS = [
  { name: "レッド",      value: "#EF4444" },
  { name: "ローズ",      value: "#F43F5E" },
  { name: "ピンク",      value: "#EC4899" },
  { name: "オレンジ",    value: "#F97316" },
  { name: "アンバー",    value: "#F59E0B" },
  { name: "イエロー",    value: "#EAB308" },
  { name: "ライム",      value: "#84CC16" },
  { name: "グリーン",    value: "#22C55E" },
  { name: "エメラルド",  value: "#10B981" },
  { name: "ティール",    value: "#14B8A6" },
  { name: "スカイ",      value: "#0EA5E9" },
  { name: "ブルー",      value: "#3B82F6" },
  { name: "インディゴ",  value: "#6366F1" },
  { name: "バイオレット",value: "#8B5CF6" },
  { name: "スレート",    value: "#64748B" },
  { name: "ストーン",    value: "#78716C" },
];

interface CategoryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSave: (data: { name: string; color: string; description?: string }) => void;
  isLoading?: boolean;
}

export function CategoryEditDialog({
  open,
  onOpenChange,
  category,
  onSave,
  isLoading = false,
}: CategoryEditDialogProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[4].value);
  const [description, setDescription] = useState(category?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!category;

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

    onSave({ name: trimmedName, color, description: description || undefined });
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

          {/* 説明文 */}
          <div className="space-y-2">
            <Label htmlFor="category-description">説明文</Label>
            <Textarea
              id="category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例: yarukotoリポジトリのフロントエンド改善"
              maxLength={200}
              rows={3}
            />
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
