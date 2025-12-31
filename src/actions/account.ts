"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/auth-server";
import { success, failure, type ActionResult } from "@/types/action-result";

export async function deleteAccount(): Promise<ActionResult<{ success: boolean }>> {
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
