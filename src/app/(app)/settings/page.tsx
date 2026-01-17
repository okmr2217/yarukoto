"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  LogOut,
  Trash2,
  Sun,
  Moon,
  Monitor,
  Edit,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { signOut, useSession, changePassword } from "@/lib/auth-client";
import { deleteAccount, changeEmail } from "@/actions";
import { useSettings, useTheme, type Theme } from "@/hooks";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    settings,
    isLoaded,
    toggleAutoCollapseCompleted,
    toggleAutoCollapseSkipped,
  } = useSettings();
  const { theme, setTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Email change states
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, startEmailTransition] = useTransition();
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Password change states
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, startPasswordTransition] = useTransition();
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push("/login");
    } catch {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteAccount();
      if (result.success) {
        router.push("/login");
      } else {
        setDeleteError(result.error);
      }
    });
  };

  const handleEmailChange = () => {
    setEmailError(null);
    setEmailSuccess(false);
    startEmailTransition(async () => {
      const result = await changeEmail(newEmail);
      if (result.success) {
        setEmailSuccess(true);
        setNewEmail("");
        setTimeout(() => {
          setIsEmailDialogOpen(false);
          setEmailSuccess(false);
          router.refresh();
        }, 1500);
      } else {
        setEmailError(result.error);
      }
    });
  };

  const handlePasswordChange = () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("新しいパスワードが一致しません");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("パスワードは8文字以上である必要があります");
      return;
    }

    startPasswordTransition(async () => {
      try {
        const result = await changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: false,
        });
        if (result.error) {
          setPasswordError(result.error.message || "パスワードの変更に失敗しました");
        } else {
          setPasswordSuccess(true);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setTimeout(() => {
            setIsPasswordDialogOpen(false);
            setPasswordSuccess(false);
          }, 1500);
        }
      } catch (error) {
        setPasswordError(
          error instanceof Error ? error.message : "パスワードの変更に失敗しました"
        );
      }
    });
  };

  return (
    <div className="flex-1 bg-background">
      {/* Header - Mobile only */}
      <header className="sticky top-0 z-10 bg-background border-b border-border md:hidden">
        <div className="flex items-center h-14 px-4">
          <Link href="/" className="p-2 -ml-2 hover:bg-accent rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="ml-2 text-lg font-semibold">設定</h1>
        </div>
      </header>

      <div className="max-w-2xl w-full mx-auto">
        {/* PC Header */}
        <header className="hidden md:flex items-center h-14 px-4 border-b border-border">
          <h1 className="text-lg font-semibold">設定</h1>
        </header>

        <main className="px-4 py-6 space-y-6">
          {/* Account Section */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              アカウント
            </h2>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">メールアドレス</div>
                    <div className="text-sm text-muted-foreground">
                      {session?.user?.email || "読み込み中..."}
                    </div>
                  </div>
                </div>
                <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>メールアドレスの変更</DialogTitle>
                      <DialogDescription>
                        新しいメールアドレスを入力してください
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-email">新しいメールアドレス</Label>
                        <Input
                          id="new-email"
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="new@example.com"
                          disabled={isChangingEmail}
                        />
                      </div>
                      {emailError && (
                        <p className="text-sm text-destructive">{emailError}</p>
                      )}
                      {emailSuccess && (
                        <p className="text-sm text-green-600">
                          メールアドレスを変更しました
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEmailDialogOpen(false);
                          setNewEmail("");
                          setEmailError(null);
                        }}
                        disabled={isChangingEmail}
                      >
                        キャンセル
                      </Button>
                      <Button
                        onClick={handleEmailChange}
                        disabled={isChangingEmail || !newEmail}
                      >
                        {isChangingEmail ? "変更中..." : "変更する"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">パスワード</div>
                    <div className="text-sm text-muted-foreground">
                      ••••••••
                    </div>
                  </div>
                </div>
                <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>パスワードの変更</DialogTitle>
                      <DialogDescription>
                        現在のパスワードと新しいパスワードを入力してください
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">現在のパスワード</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          disabled={isChangingPassword}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">新しいパスワード</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={isChangingPassword}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">
                          新しいパスワード（確認）
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isChangingPassword}
                        />
                      </div>
                      {passwordError && (
                        <p className="text-sm text-destructive">{passwordError}</p>
                      )}
                      {passwordSuccess && (
                        <p className="text-sm text-green-600">
                          パスワードを変更しました
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsPasswordDialogOpen(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                          setPasswordError(null);
                        }}
                        disabled={isChangingPassword}
                      >
                        キャンセル
                      </Button>
                      <Button
                        onClick={handlePasswordChange}
                        disabled={
                          isChangingPassword ||
                          !currentPassword ||
                          !newPassword ||
                          !confirmPassword
                        }
                      >
                        {isChangingPassword ? "変更中..." : "変更する"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </section>

          {/* Appearance Section */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              外観
            </h2>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="p-4">
                <div className="text-sm font-medium mb-3">テーマ</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                      theme === "light"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <Sun className="h-5 w-5" />
                    <span className="text-xs font-medium">ライト</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                      theme === "dark"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <Moon className="h-5 w-5" />
                    <span className="text-xs font-medium">ダーク</span>
                  </button>
                  <button
                    onClick={() => setTheme("system")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                      theme === "system"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <Monitor className="h-5 w-5" />
                    <span className="text-xs font-medium">システム</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Display Settings Section */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              表示設定
            </h2>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <Label
                  htmlFor="auto-collapse-completed"
                  className="cursor-pointer flex-1"
                >
                  完了タスクを自動で折りたたむ
                </Label>
                <Switch
                  id="auto-collapse-completed"
                  checked={isLoaded ? settings.autoCollapseCompleted : true}
                  onCheckedChange={toggleAutoCollapseCompleted}
                  disabled={!isLoaded}
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <Label
                  htmlFor="auto-collapse-skipped"
                  className="cursor-pointer flex-1"
                >
                  やらないタスクを自動で折りたたむ
                </Label>
                <Switch
                  id="auto-collapse-skipped"
                  checked={isLoaded ? settings.autoCollapseSkipped : true}
                  onCheckedChange={toggleAutoCollapseSkipped}
                  disabled={!isLoaded}
                />
              </div>
            </div>
          </section>

          {/* Other Section */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              その他
            </h2>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent transition-colors border-b border-border disabled:opacity-50"
              >
                <LogOut className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {isLoggingOut ? "ログアウト中..." : "ログアウト"}
                </span>
              </button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 text-left hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <Trash2 className="h-5 w-5 text-destructive" />
                      <span className="text-sm font-medium text-destructive">
                        アカウント削除
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded">
                      危険
                    </span>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      アカウントを削除しますか？
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      この操作は取り消せません。すべてのタスク、カテゴリ、アカウント情報が完全に削除されます。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  {deleteError && (
                    <p className="text-sm text-destructive">{deleteError}</p>
                  )}
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "削除中..." : "削除する"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>

          {/* Version */}
          <div className="text-center text-sm text-muted-foreground">
            バージョン: 1.0.0
          </div>
        </main>
      </div>
    </div>
  );
}
