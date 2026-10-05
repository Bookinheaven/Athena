import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { getPgPool, closePgPool } from "../db/index.js";
import TaskService from "../services/taskService.js";
import TaskOccurrenceService from "../services/taskOccurrenceService.js";
import sessionRepository from "../repositories/sessionRepository.js";

describe("Task Deletion & Historical Integrity Tests", () => {
  let pool;
  let userAId;
  let userBId;
  const todayDate = "2026-10-15";
  const yesterdayDate = "2026-10-14";

  before(async () => {
    pool = getPgPool();

    // Clean up test users
    const existingUsers = await pool.query(
      "SELECT id FROM users WHERE email IN ('test_del_a@example.com', 'test_del_b@example.com')"
    );
    for (const row of existingUsers.rows) {
      await pool.query("DELETE FROM sessions WHERE user_id = $1", [row.id]);
      await pool.query("DELETE FROM task_occurrences WHERE user_id = $1", [row.id]);
      await pool.query("DELETE FROM schedule_blocks WHERE user_id = $1", [row.id]);
      await pool.query("DELETE FROM tasks WHERE user_id = $1", [row.id]);
      await pool.query("DELETE FROM users WHERE id = $1", [row.id]);
    }

    const resA = await pool.query(
      `INSERT INTO users (id, username, username_lower, email, password_hash, full_name, timezone)
       VALUES (gen_random_uuid(), 'test_del_user_a', 'test_del_user_a', 'test_del_a@example.com', 'hash', 'User A', 'UTC')
       RETURNING id`
    );
    userAId = resA.rows[0].id;

    const resB = await pool.query(
      `INSERT INTO users (id, username, username_lower, email, password_hash, full_name, timezone)
       VALUES (gen_random_uuid(), 'test_del_user_b', 'test_del_user_b', 'test_del_b@example.com', 'hash', 'User B', 'UTC')
       RETURNING id`
    );
    userBId = resB.rows[0].id;
  });

  after(async () => {
    if (pool) {
      for (const uid of [userAId, userBId]) {
        if (uid) {
          await pool.query("DELETE FROM sessions WHERE user_id = $1", [uid]);
          await pool.query("DELETE FROM task_occurrences WHERE user_id = $1", [uid]);
          await pool.query("DELETE FROM schedule_blocks WHERE user_id = $1", [uid]);
          await pool.query("DELETE FROM tasks WHERE user_id = $1", [uid]);
          await pool.query("DELETE FROM users WHERE id = $1", [uid]);
        }
      }
      await closePgPool();
    }
  });

  test("1. Delete task with no historical dependencies succeeds", async () => {
    const taskRes = await pool.query(
      `INSERT INTO tasks (id, user_id, title, status, priority)
       VALUES (gen_random_uuid(), $1, 'Task with no history', 'todo', 'medium')
       RETURNING id`,
      [userAId]
    );
    const taskId = taskRes.rows[0].id;

    const deleted = await TaskService.deleteTask(userAId, taskId, new Date(todayDate), "UTC");
    assert.equal(deleted.id, taskId);

    const check = await pool.query("SELECT id FROM tasks WHERE id = $1", [taskId]);
    assert.equal(check.rows.length, 0);
  });

  test("2. Delete task with pending current occurrence cleans up occurrence and deletes task", async () => {
    const taskRes = await pool.query(
      `INSERT INTO tasks (id, user_id, title, status, priority, planned_product_date)
       VALUES (gen_random_uuid(), $1, 'Pending unexecuted task', 'todo', 'medium', $2)
       RETURNING id`,
      [userAId, todayDate]
    );
    const taskId = taskRes.rows[0].id;

    await pool.query(
      `INSERT INTO task_occurrences (id, user_id, task_id, product_date, outcome, snapshot_title, snapshot_priority)
       VALUES (gen_random_uuid(), $1, $2, $3, 'pending', 'Pending unexecuted task', 'medium')`,
      [userAId, taskId, todayDate]
    );

    const deleted = await TaskService.deleteTask(userAId, taskId, new Date(todayDate), "UTC");
    assert.equal(deleted.id, taskId);

    // Verify task deleted
    const taskCheck = await pool.query("SELECT id FROM tasks WHERE id = $1", [taskId]);
    assert.equal(taskCheck.rows.length, 0);

    // Verify pending occurrence cleaned up
    const occCheck = await pool.query("SELECT id FROM task_occurrences WHERE task_id = $1", [taskId]);
    assert.equal(occCheck.rows.length, 0);
  });

  test("3. Delete task with completed occurrence is rejected with 409 and preserves historical occurrence", async () => {
    const taskRes = await pool.query(
      `INSERT INTO tasks (id, user_id, title, status, priority, planned_product_date)
       VALUES (gen_random_uuid(), $1, 'Completed task', 'completed', 'high', $2)
       RETURNING id`,
      [userAId, yesterdayDate]
    );
    const taskId = taskRes.rows[0].id;

    await pool.query(
      `INSERT INTO task_occurrences (id, user_id, task_id, product_date, outcome, snapshot_title, snapshot_priority)
       VALUES (gen_random_uuid(), $1, $2, $3, 'completed', 'Completed task', 'high')`,
      [userAId, taskId, yesterdayDate]
    );

    await assert.rejects(
      async () => {
        await TaskService.deleteTask(userAId, taskId, new Date(todayDate), "UTC");
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.match(err.message, /historical planning records/i);
        return true;
      }
    );

    // Verify task remains intact
    const taskCheck = await pool.query("SELECT id FROM tasks WHERE id = $1", [taskId]);
    assert.equal(taskCheck.rows.length, 1);

    // Verify occurrence remains intact
    const occCheck = await pool.query("SELECT outcome FROM task_occurrences WHERE task_id = $1", [taskId]);
    assert.equal(occCheck.rows.length, 1);
    assert.equal(occCheck.rows[0].outcome, "completed");
  });

  test("4. Delete task with rescheduled occurrence is rejected with 409", async () => {
    const taskRes = await pool.query(
      `INSERT INTO tasks (id, user_id, title, status, priority, planned_product_date)
       VALUES (gen_random_uuid(), $1, 'Rescheduled task', 'todo', 'medium', $2)
       RETURNING id`,
      [userAId, todayDate]
    );
    const taskId = taskRes.rows[0].id;

    await pool.query(
      `INSERT INTO task_occurrences (id, user_id, task_id, product_date, outcome, rescheduled_to_date, snapshot_title, snapshot_priority)
       VALUES (gen_random_uuid(), $1, $2, $3, 'rescheduled', $4, 'Rescheduled task', 'medium')`,
      [userAId, taskId, yesterdayDate, todayDate]
    );

    await assert.rejects(
      async () => {
        await TaskService.deleteTask(userAId, taskId, new Date(todayDate), "UTC");
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.match(err.message, /historical planning records/i);
        return true;
      }
    );
  });

  test("5. Delete task with completed Focus session is rejected with 409 and preserves session history", async () => {
    const taskRes = await pool.query(
      `INSERT INTO tasks (id, user_id, title, status, priority)
       VALUES (gen_random_uuid(), $1, 'Focus worked task', 'todo', 'high')
       RETURNING id`,
      [userAId]
    );
    const taskId = taskRes.rows[0].id;

    // Create session
    const sessRes = await pool.query(
      `INSERT INTO sessions (id, client_session_id, user_id, title, session_type, status, total_focus_minutes)
       VALUES (gen_random_uuid(), 'sess_client_1', $1, 'Deep Work Session', 'task', 'completed', 25)
       RETURNING id`,
      [userAId]
    );
    const sessionId = sessRes.rows[0].id;

    // Link task to session via session_tasks
    await pool.query(
      `INSERT INTO session_tasks (id, session_id, task_id, sort_order, snapshot_title, snapshot_priority)
       VALUES (gen_random_uuid(), $1, $2, 0, 'Focus worked task', 'high')`,
      [sessionId, taskId]
    );

    await assert.rejects(
      async () => {
        await TaskService.deleteTask(userAId, taskId, new Date(todayDate), "UTC");
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.match(err.message, /historical focus session records/i);
        return true;
      }
    );

    // Verify session history query still has the task and its snapshots
    const history = await sessionRepository.findHistory(userAId, {});
    const targetSession = history.sessions.find((s) => s.id === sessionId);
    assert.ok(targetSession);
    assert.equal(targetSession.tasks.length, 1);
    assert.equal(targetSession.tasks[0].taskId, taskId);
    assert.equal(targetSession.tasks[0].snapshotTitle, "Focus worked task");
  });

  test("6. Delete task with standalone unstarted schedule block cleans up schedule block and deletes task", async () => {
    const taskRes = await pool.query(
      `INSERT INTO tasks (id, user_id, title, status, priority, planned_product_date)
       VALUES (gen_random_uuid(), $1, 'Scheduled task', 'todo', 'medium', $2)
       RETURNING id`,
      [userAId, todayDate]
    );
    const taskId = taskRes.rows[0].id;

    // Create unstarted schedule block
    await pool.query(
      `INSERT INTO schedule_blocks (id, user_id, task_id, product_date, start_time, end_time, duration_minutes, status)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW() + interval '30 minutes', 30, 'scheduled')`,
      [userAId, taskId, todayDate]
    );

    const deleted = await TaskService.deleteTask(userAId, taskId, new Date(todayDate), "UTC");
    assert.equal(deleted.id, taskId);

    const blockCheck = await pool.query("SELECT id FROM schedule_blocks WHERE task_id = $1", [taskId]);
    assert.equal(blockCheck.rows.length, 0);
  });

  test("7. Cross-user deletion is blocked with 404", async () => {
    const taskRes = await pool.query(
      `INSERT INTO tasks (id, user_id, title, status, priority)
       VALUES (gen_random_uuid(), $1, 'User B task', 'todo', 'medium')
       RETURNING id`,
      [userBId]
    );
    const taskBId = taskRes.rows[0].id;

    await assert.rejects(
      async () => {
        await TaskService.deleteTask(userAId, taskBId, new Date(todayDate), "UTC");
      },
      (err) => {
        assert.equal(err.statusCode, 404);
        assert.match(err.message, /not found/i);
        return true;
      }
    );
  });

  test("8. Direct SQL DELETE violating foreign keys is blocked by PostgreSQL RESTRICT", async () => {
    const taskRes = await pool.query(
      `INSERT INTO tasks (id, user_id, title, status, priority)
       VALUES (gen_random_uuid(), $1, 'Direct delete protected task', 'todo', 'medium')
       RETURNING id`,
      [userAId]
    );
    const taskId = taskRes.rows[0].id;

    await pool.query(
      `INSERT INTO task_occurrences (id, user_id, task_id, product_date, outcome, snapshot_title, snapshot_priority)
       VALUES (gen_random_uuid(), $1, $2, $3, 'completed', 'Direct delete protected task', 'medium')`,
      [userAId, taskId, todayDate]
    );

    // Direct SQL delete attempt must fail with PostgreSQL code 23503
    await assert.rejects(
      async () => {
        await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);
      },
      (err) => {
        assert.equal(err.code, "23503");
        return true;
      }
    );
  });
});
