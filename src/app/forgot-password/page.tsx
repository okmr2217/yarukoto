import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { ForgotPasswordForm } from "@/components/auth";

export const metadata = {
  title: "パスワードリセット | Yarukoto",
  description: "パスワードをリセットします",
};

export default async function ForgotPasswordPage() {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
