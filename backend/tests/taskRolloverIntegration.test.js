import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { getPgPool, closePgPool } from "../db/index.js";
import TaskOccurrenceService from "../services/taskOccurrenceService.js";

describe("Daily Closeout & Tomorrow Rollover Integration Tests", () => {
  let pool;
  let userAId;
  let userBId;
  const fromDate = "2026-10-15";
  const toDate = "2026-10-16";

  before(async () => {
    pool = getPgPool();

    // Clean up any test users from previous test runs
    const existingUsers = await pool.query("SELECT id FROM users WHERE email IN ('test_rollover_a@example.com', 'test_rollover_b@example.com')");
    for (const row of existingUsers.rows) {
      await pool.query("DELETE FROM task_occurrences WHERE user_id = $1", [row.id]);
      await pool.query("DELETE FROM tasks WHERE user_id = $1", [row.id]);
      await pool.query("DELETE FROM users WHERE id = $1", [row.id]);
    }

    // Insert test user A
    const resA = await pool.query(
      `INSERT INTO users (id, username, username_lower, email, password_hash, full_name, timezone)
       VALUES (gen_random_uuid(), 'test_roll_a', 'test_roll_a', 'test_rollover_a@example.com', 'hash', 'User A', 'UTC')
       RETURNING id`
    );
    userAId = resA.rows[0].id;

    // Insert test user B
    const resB = await pool.query(
      `INSERT INTO users (id, username, username_lower, email, password_hash, full_name, timezone)
       VALUES (gen_random_uuid(), 'test_roll_b', 'test_roll_b', 'test_rollover_b@example.com', 'hash', 'User B', 'UTC')
       RETURNING id`
    );
    userBId = resB.rows[0].id;
  });

  after(async () => {
    if (pool) {
      if (userAId) {
        await pool.query("DELETE FROM task_occurrences WHERE user_id = $1", [userAId]);
        await pool.query("DELETE FROM tasks WHERE user_id = $1", [userAId]);
        await pool.query("DELETE FROM users WHERE id = $1", [userAId]);
      }
      if (userBId) {
        await pool.query("DELETE FROM task_occurrences WHERE user_id = $1", [userBId]);
        await pool.query("DELETE FROM tasks WHERE user_id = $1", [userBId]);
        await pool.query("DELETE FROM users WHERE id = $1", [userBId]);
      }
      await closePgPool();
    }
  });

  test("1. Rollover moves pending task to tomorrow: updates task planned date, marks source rescheduled, creates destination pending", async () => {
    // Create task
    const taskRes = await pool.query(
      `INSERT INTO tasks (id, user_id, title, status, priority, planned_product_date)
       VALUES (gen_random_uuid(), $1, 'Finish writeup', 'todo', 'high', $2)
       RETURNING id`,
      [userAId, fromDate]
    );
    const taskId = taskRes.rows[0].id;

    // Create source occurrence
    await pool.query(
      `INSERT INTO task_occurrences (id, user_id, task_id, product_date, outcome, snapshot_title, snapshot_priority)
       VALUES (gen_random_uuid(), $1, $2, $3, 'pending', 'Finish writeup', 'high')`,
      [userAId, taskId, fromDate]
    );

    // Execute rollover
    const result = await TaskOccurrenceService.rolloverTasks(
      userAId,
      fromDate,
      toDate,
      [taskId]
    );

    assert.equal(result.rolledOver.length, 1);
    assert.equal(result.rolledOver[0].taskId, taskId);
    assert.equal(result.skipped.length, 0);

    const toDateStr = (val) => {
      if (!val) return null;
      if (typeof val === "string") return val.slice(0, 10);
      if (val instanceof Date) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, "0");
        const d = String(val.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
      return String(val).slice(0, 10);
    };

    // Verify source occurrence state
    const sourceOcc = await pool.query(
      "SELECT outcome, rescheduled_to_date FROM task_occurrences WHERE user_id = $1 AND task_id = $2 AND product_date = $3",
      [userAId, taskId, fromDate]
    );
    assert.equal(sourceOcc.rows.length, 1);
    assert.equal(sourceOcc.rows[0].outcome, "rescheduled");
    const resDate = toDateStr(sourceOcc.rows[0].rescheduled_to_date);
    assert.equal(resDate, toDate);

    // Verify destination occurrence state
    const destOcc = await pool.query(
      "SELECT outcome FROM task_occurrences WHERE user_id = $1 AND task_id = $2 AND product_date = $3",
      [userAId, taskId, toDate]
    );
    assert.equal(destOcc.rows.length, 1);
    assert.equal(destOcc.rows[0].outcome, "pending");

    // Verify task planned_product_date updated to toDate
    const taskCheck = await pool.query(
      "SELECT planned_product_date FROM tasks WHERE id = $1",
      [taskId]
    );
    const plannedDate = toDateStr(taskCheck.rows[0].planned_product_date);
    assert.equal(plannedDate, toDate);
  });

  test("2. Rollover is idempotent: repeated call returns skipped and does not duplicate destination occurrences", async () => {
    // Create task
    const taskRes = await pool.query(
      `INSERT INTO tasks (id, user_id, title, status, priority, planned_product_date)
       VALUES (gen_random_uuid(), $1, 'Idempotent task', 'todo', 'medium', $2)
       RETURNING id`,
      [userAId, fromDate]
    );
    const taskId = taskRes.rows[0].id;

    // Create source occurrence
    await pool.query(
      `INSERT INTO task_occurrences (id, user_id, task_id, product_date, outcome, snapshot_title, snapshot_priority)
       VALUES (gen_random_uuid(), $1, $2, $3, 'pending', 'Idempotent task', 'medium')`,
      [userAId, taskId, fromDate]
    );

    // First call
    const firstRes = await TaskOccurrenceService.rolloverTasks(userAId, fromDate, toDate, [taskId]);
    assert.equal(firstRes.rolledOver.length, 1);

    // Repeated call with the exact same parameters
    const secondRes = await TaskOccurrenceService.rolloverTasks(userAId, fromDate, toDate, [taskId]);
    assert.equal(secondRes.rolledOver.length, 0);
    assert.equal(secondRes.skipped.length, 1);
    assert.match(secondRes.skipped[0].reason, /already rolled over/i);

    // Destination occurrences count must strictly be 1
    const destOccs = await pool.query(
      "SELECT COUNT(*) FROM task_occurrences WHERE user_id = $1 AND task_id = $2 AND product_date = $3",
      [userAId, taskId, toDate]
    );
    assert.equal(parseInt(destOccs.rows[0].count, 10), 1);
  });

  test("3. Ineligible tasks are skipped: completed and cancelled occurrences cannot be rolled over", async () => {
    // 3a. Completed task occurrence
    const completedTask = await pool.query(
      `INSERT INTO tasks (id, user_id, title, status, priority, planned_product_date)
       VALUES (gen_random_uuid(), $1, 'Completed task', 'completed', 'medium', $2)
       RETURNING id`,
      [userAId, fromDate]
    );
    const completedTaskId = completedTask.rows[0].id;
    await pool.query(
      `INSERT INTO task_occurrences (id, user_id, task_id, product_date, outcome, snapshot_title, snapshot_priority)
       VALUES (gen_random_uuid(), $1, $2, $3, 'completed', 'Completed task', 'medium')`,
      [userAId, completedTaskId, fromDate]
    );

    // 3b. Cancelled task occurrence
    const cancelledTask = await pool.query(
      `INSERT INTO tasks (id, user_id, title, status, priority, planned_product_date)
       VALUES (gen_random_uuid(), $1, 'Cancelled task', 'cancelled', 'medium', $2)
       RETURNING id`,
      [userAId, fromDate]
    );
    const cancelledTaskId = cancelledTask.rows[0].id;
    await pool.query(
      `INSERT INTO task_occurrences (id, user_id, task_id, product_date, outcome, snapshot_title, snapshot_priority)
       VALUES (gen_random_uuid(), $1, $2, $3, 'cancelled', 'Cancelled task', 'medium')`,
      [userAId, cancelledTaskId, fromDate]
    );

    const result = await TaskOccurrenceService.rolloverTasks(
      userAId,
      fromDate,
      toDate,
      [completedTaskId, cancelledTaskId]
    );

    assert.equal(result.rolledOver.length, 0);
    assert.equal(result.skipped.length, 2);
    assert.match(result.skipped[0].reason, /already completed/i);
    assert.match(result.skipped[1].reason, /cancelled/i);
  });

  test("4. Cross-user isolation and atomic rollback: rejecting foreign task rolls back entire transaction", async () => {
    // User A task
    const taskA = await pool.query(
      `INSERT INTO tasks (id, user_id, title, status, priority, planned_product_date)
       VALUES (gen_random_uuid(), $1, 'User A task', 'todo', 'medium', $2)
       RETURNING id`,
      [userAId, fromDate]
    );
    const taskAId = taskA.rows[0].id;
    await pool.query(
      `INSERT INTO task_occurrences (id, user_id, task_id, product_date, outcome, snapshot_title, snapshot_priority)
       VALUES (gen_random_uuid(), $1, $2, $3, 'pending', 'User A task', 'medium')`,
      [userAId, taskAId, fromDate]
    );

    // User B task
    const taskB = await pool.query(
      `INSERT INTO tasks (id, user_id, title, status, priority, planned_product_date)
       VALUES (gen_random_uuid(), $1, 'User B task', 'todo', 'medium', $2)
       RETURNING id`,
      [userBId, fromDate]
    );
    const taskBId = taskB.rows[0].id;

    // User A tries to rollover both taskA and taskB (cross-user attack/leak)
    await assert.rejects(
      async () => {
        await TaskOccurrenceService.rolloverTasks(
          userAId,
          fromDate,
          toDate,
          [taskAId, taskBId]
        );
      },
      (err) => {
        assert.equal(err.statusCode, 404);
        assert.match(err.message, /access denied|not found/i);
        return true;
      }
    );

    // Atomicity check: taskA MUST NOT have been rolled over because of ROLLBACK
    const occACheck = await pool.query(
      "SELECT outcome FROM task_occurrences WHERE user_id = $1 AND task_id = $2 AND product_date = $3",
      [userAId, taskAId, fromDate]
    );
    assert.equal(occACheck.rows[0].outcome, "pending");

    const destOccA = await pool.query(
      "SELECT outcome FROM task_occurrences WHERE user_id = $1 AND task_id = $2 AND product_date = $3",
      [userAId, taskAId, toDate]
    );
    assert.equal(destOccA.rows.length, 0);
  });

  test("5. Date validation prevents invalid, identical, or backward rollover dates", async () => {
    // toProductDate == fromProductDate
    await assert.rejects(
      async () => {
        await TaskOccurrenceService.rolloverTasks(userAId, fromDate, fromDate, ["dummy-id"]);
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /strictly after/i);
        return true;
      }
    );

    // toProductDate < fromProductDate
    await assert.rejects(
      async () => {
        await TaskOccurrenceService.rolloverTasks(userAId, "2026-10-20", "2026-10-19", ["dummy-id"]);
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /strictly after/i);
        return true;
      }
    );

    // Invalid format
    await assert.rejects(
      async () => {
        await TaskOccurrenceService.rolloverTasks(userAId, "invalid-date", toDate, ["dummy-id"]);
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
  });

  test("6. Rolled-over tasks exclude from effective planned work in Streak and DailyStats without inflating completions", async () => {
    const { default: StreakService } = await import("../services/streakService.js");

    // Create 1 completed task and 1 pending task for fromDate
    const compTask = await pool.query(
      `INSERT INTO tasks (id, user_id, title, status, priority, planned_product_date)
       VALUES (gen_random_uuid(), $1, 'Task A Completed', 'completed', 'medium', $2)
       RETURNING id`,
      [userAId, fromDate]
    );
    const pendTask = await pool.query(
      `INSERT INTO tasks (id, user_id, title, status, priority, planned_product_date)
       VALUES (gen_random_uuid(), $1, 'Task B Pending', 'todo', 'medium', $2)
       RETURNING id`,
      [userAId, fromDate]
    );

    await pool.query(
      `INSERT INTO task_occurrences (id, user_id, task_id, product_date, outcome, snapshot_title, snapshot_priority)
       VALUES
       (gen_random_uuid(), $1, $2, $3, 'completed', 'Task A Completed', 'medium'),
       (gen_random_uuid(), $1, $4, $3, 'pending', 'Task B Pending', 'medium')`,
      [userAId, compTask.rows[0].id, fromDate, pendTask.rows[0].id]
    );

    // Rollover pending task B to toDate
    const rollRes = await TaskOccurrenceService.rolloverTasks(
      userAId,
      fromDate,
      toDate,
      [pendTask.rows[0].id]
    );
    assert.equal(rollRes.rolledOver.length, 1);

    // Evaluate occurrences for the 2 tasks on fromDate
    const occsFromDate = await pool.query(
      "SELECT outcome FROM task_occurrences WHERE user_id = $1 AND product_date = $2 AND task_id = ANY($3)",
      [userAId, fromDate, [compTask.rows[0].id, pendTask.rows[0].id]]
    );
    const evalResult = StreakService.evaluateOccurrencesArray(occsFromDate.rows, false);

    // Effective planned is 1 (completed: 1, rescheduled: 1, total: 2)
    assert.equal(evalResult.totalPlanned, 2);
    assert.equal(evalResult.rescheduled, 1);
    assert.equal(evalResult.effectivePlanned, 1);
    assert.equal(evalResult.completed, 1);
    assert.equal(evalResult.completionRate, 1.0);
    assert.equal(evalResult.resultType, "success");
  });
});
