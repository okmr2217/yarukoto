import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { ResetPasswordForm } from "@/components/auth";

export const metadata = {
  title: "パスワード再設定 | Yarukoto",
  description: "新しいパスワードを設定します",
};

export default async function ResetPasswordPage() {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
