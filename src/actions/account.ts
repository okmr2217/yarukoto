"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/auth-server";
import { success, failure, type ActionResult } from "@/types/action-result";

export async function changeEmail(
  newEmail: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const session = await getRequiredSession();
    const userId = session.user.id;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return failure("無効なメールアドレス形式です", "VALIDATION_ERROR");
    }

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUser && existingUser.id !== userId) {
      return failure(
        "このメールアドレスは既に使用されています",
        "VALIDATION_ERROR"
      );
    }

    // Update email directly without verification
    await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
    });

    return success({ success: true });
  } catch (error) {
    console.error("Failed to change email:", error);
    return failure(
      "メールアドレスの変更に失敗しました",
      "INTERNAL_ERROR"
    );
  }
}

export async function deleteAccount(): Promise<
  ActionResult<{ success: boolean }>
> {
  try {
    const session = await getRequiredSession();
    const userId = session.user.id;

    // Delete all user data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete all tasks belonging to the user
      await tx.task.deleteMany({
        where: { userId },
      });

      // Delete all categories belonging to the user
      await tx.category.deleteMany({
        where: { userId },
      });

      // Delete all sessions
      await tx.session.deleteMany({
        where: { userId },
      });

      // Delete all accounts (OAuth providers)
      await tx.account.deleteMany({
        where: { userId },
      });

      // Delete the user
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return success({ success: true });
  } catch (error) {
    console.error("Failed to delete account:", error);
    return failure("アカウントの削除に失敗しました", "INTERNAL_ERROR");
  }
}
