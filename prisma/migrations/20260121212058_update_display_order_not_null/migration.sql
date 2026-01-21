-- Step 1: displayOrderがnullのタスクにcreatedAt昇順で連番を割り当て
WITH null_tasks AS (
  SELECT
    id,
    "userId",
    ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt" ASC) AS order_num
  FROM "tasks"
  WHERE "displayOrder" IS NULL
)
UPDATE "tasks"
SET "displayOrder" = null_tasks.order_num
FROM null_tasks
WHERE "tasks".id = null_tasks.id;

-- Step 2: 既存のdisplayOrderを持つタスクに、userId毎の最大連番+1から再割り当て
WITH existing_tasks AS (
  SELECT
    id,
    "userId",
    "displayOrder",
    (
      SELECT COALESCE(MAX(t2."displayOrder"), 0)
      FROM "tasks" t2
      WHERE t2."userId" = t1."userId" AND t2."displayOrder" IS NOT NULL
    ) AS max_order_in_user
  FROM "tasks" t1
  WHERE "displayOrder" IS NOT NULL
),
ranked_existing AS (
  SELECT
    id,
    max_order_in_user + ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "displayOrder" DESC) AS new_order
  FROM existing_tasks
)
UPDATE "tasks"
SET "displayOrder" = ranked_existing.new_order
FROM ranked_existing
WHERE "tasks".id = ranked_existing.id;

-- Step 3: displayOrderをNOT NULLに変更
ALTER TABLE "tasks" ALTER COLUMN "displayOrder" SET NOT NULL;
