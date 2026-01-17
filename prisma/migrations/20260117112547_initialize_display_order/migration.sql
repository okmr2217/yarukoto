-- 既存タスクのdisplayOrderを初期化（ユーザーごとに作成日降順で連番を割り当て）
WITH ranked_tasks AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt" DESC) - 1 AS order_num
  FROM "tasks"
  WHERE "displayOrder" IS NULL
)
UPDATE "tasks"
SET "displayOrder" = ranked_tasks.order_num
FROM ranked_tasks
WHERE "tasks".id = ranked_tasks.id;