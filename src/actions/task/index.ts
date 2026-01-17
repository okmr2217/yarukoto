/**
 * タスク関連のServer Actions
 *
 * このモジュールは、タスクのCRUD操作と検索機能を提供します。
 * すべての操作は認証されたユーザーに対してのみ実行されます。
 */

// クエリ操作（データ取得）
export {
  getTodayTasks,
  getTasksByDate,
  searchTasks,
  getAllTasks,
  getMonthlyTaskStats,
} from "./task-queries";

// ミューテーション操作（データ更新）
export {
  createTask,
  updateTask,
  completeTask,
  uncompleteTask,
  skipTask,
  unskipTask,
  deleteTask,
} from "./task-mutations";

// ヘルパー関数
export { toTask } from "@/lib/task-helpers";
