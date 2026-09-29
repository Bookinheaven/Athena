// ─────────────────────────────────────────────────────────────────────────────
// PersistenceQueue
//
// Serialises write requests so only one PATCH is in-flight at a time.
// This eliminates the "last-write-wins" race where two concurrent PATCHes
// could corrupt segment state.
//
// Usage:
//   const queue = new PersistenceQueue(saveFn);
//   queue.enqueue('progress', payload1);  // fires immediately
//   queue.enqueue('segment_complete', payload2);  // waits for payload1
//   queue.flush();                        // force-drain before unload
// ─────────────────────────────────────────────────────────────────────────────

export class PersistenceQueue {
  /**
   * @param {(type: string, payload: object) => Promise<any>} saveFn
   *   Called for each queued item. Must return a Promise.
   * @param {(status: 'saving'|'saved'|'error') => void} [onStatus]
   *   Optional callback for UI status indicator.
   */
  constructor(saveFn, onStatus) {
    this._saveFn    = saveFn;
    this._onStatus  = onStatus || (() => {});
    this._queue     = [];        // Array<{ type, payload }>
    this._running   = false;
    this._retries   = 0;
    this._MAX_RETRY = 3;
  }

  /**
   * Enqueue a write operation.
   *
   * If the type is 'complete', it supersedes any queued 'progress' entries
   * to avoid a stale progress write racing with the completion write.
   *
   * @param {string} type     – e.g. 'progress', 'pause', 'complete'
   * @param {object} payload  – Sent to saveFn
   */
  enqueue(type, payload) {
    // Completion supersedes progress to prevent a stale PATCH overwrite
    if (type === 'complete') {
      this._queue = this._queue.filter((item) => item.type !== 'progress');
    }

    this._queue.push({ type, payload });
    this._drain();
  }

  /**
   * Force-drain the queue synchronously where possible.
   * Called on visibility hide or before navigation.
   */
  async flush() {
    while (this._queue.length > 0) {
      const { type, payload } = this._queue.shift();
      try {
        await this._saveFn(type, payload);
      } catch (e) {
        // Best-effort on flush — do not rethrow
        console.error('[PersistenceQueue] flush error:', e);
      }
    }
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  async _drain() {
    if (this._running || this._queue.length === 0) return;

    this._running = true;
    this._onStatus('saving');

    while (this._queue.length > 0) {
      const { type, payload } = this._queue[0];

      try {
        await this._saveFn(type, payload);
        this._queue.shift(); // remove after success
        this._retries = 0;
      } catch (err) {
        this._retries++;
        console.error(`[PersistenceQueue] write failed (attempt ${this._retries}):`, err);

        if (this._retries >= this._MAX_RETRY) {
          // Give up on this item to avoid blocking the queue indefinitely
          this._queue.shift();
          this._retries = 0;
          this._onStatus('error');
        } else {
          // Back-off before retry
          await delay(this._retries * 2000);
        }
      }
    }

    this._running = false;
    this._onStatus('saved');
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
