"use client";

import { Calendar, Clock, Tag, User, FileText, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { TaskDetail } from "@/types";
import {
  formatDateForDisplay,
  formatDateTimeForDisplay,
  parseJSTDate,
} from "@/lib/dateUtils";
import { LinkText } from "@/components/ui/link-text";

// ── ヘルパー ──────────────────────────────────────────────────

function formatDateStr(dateStr: string): string {
  return formatDateForDisplay(parseJSTDate(dateStr));
}

// ── バッジ ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TaskDetail["status"] }) {
  if (status === "COMPLETED") {
    return <Badge>完了</Badge>;
  }
  if (status === "SKIPPED") {
    return <Badge variant="secondary">スキップ</Badge>;
  }
  return <Badge variant="outline">未完了</Badge>;
}

function PriorityBadge({ priority }: { priority: TaskDetail["priority"] }) {
  if (!priority) return null;
  if (priority === "HIGH") {
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
        高
      </Badge>
    );
  }
  if (priority === "MEDIUM") {
    return (
      <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">
        中
      </Badge>
    );
  }
  return (
    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20">
      低
    </Badge>
  );
}

// ── DetailRow ─────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex items-start gap-2 w-28 shrink-0 text-muted-foreground pt-0.5">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );
}

// ── TaskDetailContent ─────────────────────────────────────────

function TaskDetailContent({ task }: { task: TaskDetail }) {
  return (
    <div className="space-y-4 py-2">
      {/* ステータス・優先度バッジ */}
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
      </div>

      <Separator />

      {/* 基本情報 */}
      <div className="space-y-3">
        {task.memo && (
          <DetailRow icon={<FileText className="h-4 w-4 shrink-0" />} label="備考">
            <LinkText text={task.memo} className="whitespace-pre-wrap text-sm" />
          </DetailRow>
        )}

        {task.category && (
          <DetailRow icon={<Tag className="h-4 w-4 shrink-0" />} label="カテゴリ">
            <span className="flex items-center gap-1.5">
              {task.category.color && (
                <span
                  className="inline-block w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: task.category.color }}
                />
              )}
              {task.category.name}
            </span>
          </DetailRow>
        )}

        {task.scheduledAt && (
          <DetailRow icon={<Calendar className="h-4 w-4 shrink-0" />} label="予定日">
            {formatDateStr(task.scheduledAt)}
          </DetailRow>
        )}
      </div>

      {/* 完了・スキップ情報 */}
      {task.status === "COMPLETED" && task.completedAt && (
        <>
          <Separator />
          <div className="space-y-3">
            <DetailRow icon={<Clock className="h-4 w-4 shrink-0" />} label="完了日時">
              {formatDateTimeForDisplay(new Date(task.completedAt!))}
            </DetailRow>
          </div>
        </>
      )}

      {task.status === "SKIPPED" && task.skippedAt && (
        <>
          <Separator />
          <div className="space-y-3">
            <DetailRow icon={<Clock className="h-4 w-4 shrink-0" />} label="スキップ日時">
              {formatDateTimeForDisplay(new Date(task.skippedAt!))}
            </DetailRow>
            {task.skipReason && (
              <DetailRow icon={<AlertCircle className="h-4 w-4 shrink-0" />} label="スキップ理由">
                {task.skipReason}
              </DetailRow>
            )}
          </div>
        </>
      )}

      <Separator />

      {/* メタ情報 */}
      <div className="space-y-3">
        <DetailRow icon={<User className="h-4 w-4 shrink-0" />} label="作成者">
          <span className="text-muted-foreground">
            {task.user.name ?? task.user.email}
          </span>
        </DetailRow>
        <DetailRow icon={<Clock className="h-4 w-4 shrink-0" />} label="作成日時">
          <span className="text-muted-foreground">
            {formatDateTimeForDisplay(new Date(task.createdAt))}
          </span>
        </DetailRow>
        <DetailRow icon={<Clock className="h-4 w-4 shrink-0" />} label="更新日時">
          <span className="text-muted-foreground">
            {formatDateTimeForDisplay(new Date(task.updatedAt))}
          </span>
        </DetailRow>
      </div>
    </div>
  );
}

// ── TaskDetailSheet ───────────────────────────────────────────

export interface TaskDetailSheetProps {
  task: TaskDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
}: TaskDetailSheetProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!task) return null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{task.title}</DialogTitle>
            <DialogDescription>タスクの詳細情報</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <TaskDetailContent task={task} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{task.title}</DrawerTitle>
          <DrawerDescription>タスクの詳細情報</DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="max-h-[60vh] px-4 pb-6">
          <TaskDetailContent task={task} />
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
