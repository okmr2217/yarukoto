import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { SignupForm } from "@/components/auth";

export const metadata = {
  title: "新規登録 | Yarukoto",
  description: "Yarukotoに登録して今日のタスクを管理しましょう",
};

export default async function SignupPage() {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SignupForm />
    </Suspense>
  );
}
