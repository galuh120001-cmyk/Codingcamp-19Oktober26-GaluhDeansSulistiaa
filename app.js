// app.js — To-Do Life Dashboard
// Module implementations will be added in subsequent tasks.

// ---------------------------------------------------------------------------
// StorageUtil
// A thin wrapper around localStorage that keeps all persistence concerns in
// one place.  Every call is guarded so that storage being unavailable (e.g.
// private-browsing mode, quota exceeded) never throws unhandled exceptions.
// Satisfies requirements: 5.1, 5.2, 5.4, 7.2, 7.3
// ---------------------------------------------------------------------------
const StorageUtil = {
  /**
   * Read and parse a JSON value from localStorage.
   *
   * @param {string} key
   * @returns {*} The parsed value, or null if the key is missing, the stored
   *              string is not valid JSON, or storage is unavailable.
   */
  read(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  },

  /**
   * Serialize a value to JSON and persist it in localStorage.
   *
   * @param {string} key
   * @param {*} value  Any JSON-serialisable value.
   * @returns {{ ok: true } | { ok: false, error: Error }}
   */
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  },
};

// ---------------------------------------------------------------------------
// GreetingModule
// Handles the live clock, full date display, and time-aware greeting.
// Satisfies requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
// ---------------------------------------------------------------------------
const GreetingModule = {
  /**
   * Returns a time-appropriate greeting string based on the hour of the day.
   * Pure function — no side effects, no DOM access.
   *
   * @param {number} hour  Integer in the range [0, 23].
   * @returns {string}     One of: "Good Morning", "Good Afternoon",
   *                       "Good Evening", "Good Night".
   */
  _greeting(hour) {
    if (hour >= 5 && hour <= 11) return "Good Morning";
    if (hour >= 12 && hour <= 17) return "Good Afternoon";
    if (hour >= 18 && hour <= 20) return "Good Evening";
    return "Good Night"; // covers 21–23 and 0–4
  },

  /**
   * Zero-pads a time component to exactly two digits and assembles the
   * formatted clock string.
   * Pure function — no side effects, no DOM access.
   *
   * @param {number} h  Hours   (0–23)
   * @param {number} m  Minutes (0–59)
   * @param {number} s  Seconds (0–59)
   * @returns {string}  Time in "HH:MM:SS" format.
   */
  _formatTime(h, m, s) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  },

  /**
   * Called every second (and once immediately on init) to update the DOM
   * with the current clock, date, and greeting.
   *
   * Satisfies requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
   */
  _tick() {
    const clockEl    = document.getElementById("clock");
    const dateEl     = document.getElementById("date");
    const greetingEl = document.getElementById("greeting");

    const date = new Date();

    // Fallback if the system clock returns an invalid date (requirement 1.7)
    if (isNaN(date.getTime())) {
      clockEl.textContent    = "Time unavailable";
      dateEl.textContent     = "Time unavailable";
      greetingEl.textContent = "Time unavailable";
      return;
    }

    // --- Clock (HH:MM:SS) ---
    clockEl.textContent = this._formatTime(
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    );

    // --- Full date ("DayName, MonthName DayNumber Year") ---
    const DAY_NAMES = [
      "Sunday", "Monday", "Tuesday", "Wednesday",
      "Thursday", "Friday", "Saturday",
    ];
    const MONTH_NAMES = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const dayName   = DAY_NAMES[date.getDay()];
    const monthName = MONTH_NAMES[date.getMonth()];
    const dayNum    = date.getDate();
    const year      = date.getFullYear();
    dateEl.textContent = `${dayName}, ${monthName} ${dayNum}, ${year}`;

    // --- Greeting ---
    greetingEl.textContent = this._greeting(date.getHours());
  },

  /**
   * Bootstraps the Greeting panel: fires one immediate tick so the clock
   * appears instantly (no blank flash), then starts a 1-second interval.
   *
   * Satisfies requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
   */
  init() {
    this._tick();                              // render immediately on load
    setInterval(() => this._tick(), 1000);    // update every second
  },
};

// ---------------------------------------------------------------------------
// FocusTimerModule
// 25-minute countdown timer with Start / Stop / Reset controls.
// Satisfies requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
// ---------------------------------------------------------------------------
const FocusTimerModule = {
  // ── Internal state ────────────────────────────────────────────────────────
  totalSeconds: 1500,   // 25 × 60
  remaining:    1500,
  intervalId:   null,   // null = stopped
  complete:     false,

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Formats `remaining` as "MM:SS" and pushes it into the DOM.
   * Also shows / hides the session-complete message.
   *
   * Satisfies requirements: 2.3, 2.8
   */
  _render() {
    const minutes = Math.floor(this.remaining / 60);
    const seconds = this.remaining % 60;
    const pad     = (n) => String(n).padStart(2, "0");

    const display = document.getElementById("timer-display");
    const message = document.getElementById("timer-message");

    if (display) {
      display.textContent = `${pad(minutes)}:${pad(seconds)}`;
    }
    if (message) {
      message.textContent = this.complete
        ? "Session complete! Great work."
        : "";
    }
  },

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Starts the countdown interval.
   * Idempotent: no-op if the timer is already running.
   *
   * Satisfies requirements: 2.4, 2.6
   */
  start() {
    if (this.intervalId !== null) return; // already running — guard
    if (this.complete) return;             // session already finished

    this.intervalId = setInterval(() => this._tick(), 1000);
  },

  /**
   * Pauses the countdown by clearing the interval.
   * Idempotent: no-op if the timer is already stopped.
   *
   * Satisfies requirements: 2.5, 2.7
   */
  stop() {
    if (this.intervalId === null) return; // already stopped — guard

    clearInterval(this.intervalId);
    this.intervalId = null;
  },

  /**
   * Resets the timer to its initial 25:00 state from any state
   * (Idle, Running, Paused, or Complete).
   *
   * Satisfies requirements: 2.9
   */
  reset() {
    this.stop();                         // clears interval if running
    this.remaining = this.totalSeconds;  // restore to 25:00
    this.complete  = false;
    this._render();                      // update display immediately
  },

  /**
   * Called once per second while the timer is running.
   * Decrements `remaining` by 1. When it reaches 0, stops the interval,
   * marks the session complete, and renders the completion message.
   * Never decrements below zero.
   *
   * Satisfies requirements: 2.2, 2.3, 2.8
   */
  _tick() {
    if (this.remaining <= 0) {
      // Safety guard: should not happen in normal flow, but prevents
      // decrementing below zero if _tick fires an extra time.
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.complete   = true;
      this._render();
      return;
    }

    this.remaining -= 1;

    if (this.remaining <= 0) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.complete   = true;
    }

    this._render();
  },

  /**
   * Bootstraps the Focus Timer panel: renders the initial 25:00 display
   * and wires up the Start, Stop, and Reset buttons.
   *
   * Satisfies requirements: 2.1, 2.4, 2.5, 2.9
   */
  init() {
    this._render(); // show 25:00 immediately

    const btnStart = document.getElementById("btn-start");
    const btnStop  = document.getElementById("btn-stop");
    const btnReset = document.getElementById("btn-reset");

    if (btnStart) btnStart.addEventListener("click", () => this.start());
    if (btnStop)  btnStop.addEventListener("click",  () => this.stop());
    if (btnReset) btnReset.addEventListener("click", () => this.reset());
  },
};

// ---------------------------------------------------------------------------
// TodoModule
// Full CRUD task management with localStorage persistence.
// Satisfies requirements: 3.1–3.5, 4.1–4.6, 5.1–5.5
// ---------------------------------------------------------------------------
const TodoModule = {
  // ── Internal state ────────────────────────────────────────────────────────
  tasks:     [],    // in-memory Task array; source of truth for render()
  editingId: null,  // id of the Task currently in inline-edit mode, or null

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Generates a unique string id.
   * Prefers `crypto.randomUUID()` (available in all target browsers).
   * Falls back to `Date.now().toString()` if the API is unavailable.
   *
   * @returns {string}
   */
  _generateId() {
    try {
      return crypto.randomUUID();
    } catch {
      return Date.now().toString();
    }
  },

  /**
   * Validates a task description against the empty/whitespace rule and an
   * optional character-length ceiling.
   *
   * @param {string} text    The raw input value to validate.
   * @param {number} maxLen  Maximum allowed character count after trimming.
   * @returns {{ ok: true } | { ok: false, error: string }}
   *
   * Satisfies requirements: 3.3, 4.3
   */
  _validate(text, maxLen) {
    if (!text || text.trim().length === 0) {
      return { ok: false, error: "Task description cannot be empty." };
    }
    if (text.trim().length > maxLen) {
      return { ok: false, error: `Description must be ${maxLen} characters or fewer.` };
    }
    return { ok: true };
  },

  // ── Public API (stubs — implemented in subsequent tasks) ──────────────────

  /**
   * Shows a write-failure banner above the task list.
   * Creates it if absent, updates text if already present.
   *
   * Satisfies requirement: 5.4
   */
  _showWriteError() {
    const ul = document.getElementById("todo-list");
    if (!ul) return;

    let banner = document.getElementById("todo-write-error");
    if (!banner) {
      banner = document.createElement("p");
      banner.id        = "todo-write-error";
      banner.className = "error-message";
      banner.setAttribute("role", "alert");
      ul.parentNode.insertBefore(banner, ul);
    }
    banner.textContent = "Could not save changes. Storage unavailable.";
  },

  /**
   * Removes the write-failure banner if it is present.
   */
  _clearWriteError() {
    const banner = document.getElementById("todo-write-error");
    if (banner) banner.remove();
  },

  /**
   * Adds a new Task with the given description.
   * Validates with maxLen = 200.
   *
   * Satisfies requirements: 3.1, 3.2, 3.4, 3.5, 5.1
   *
   * @param {string} text
   */
  addTask(text) {
    const errorEl = document.getElementById("todo-error");
    const inputEl = document.getElementById("todo-input");

    const result = this._validate(text, 200);

    if (!result.ok) {
      // Show inline validation error and keep focus on the input (req 3.3)
      if (errorEl) errorEl.textContent = result.error;
      if (inputEl) inputEl.focus();
      return;
    }

    // Clear any previous validation error
    if (errorEl) errorEl.textContent = "";

    // Build the new task object
    const task = {
      id:          this._generateId(),
      description: text.trim(),
      completed:   false,
    };

    this.tasks.push(task);

    // Persist — surface a banner if storage is unavailable (req 5.4)
    const writeResult = StorageUtil.write("tasks", this.tasks);
    if (!writeResult.ok) {
      this._showWriteError();
    } else {
      this._clearWriteError();
    }

    // Clear the input field after a successful add (req 3.1)
    if (inputEl) inputEl.value = "";

    this.render();
  },

  /**
   * Updates the description of an existing Task identified by `id`.
   * Validates with maxLen = 500. On success, persists and re-renders.
   * On failure, returns the error string so the inline edit UI can display it.
   *
   * Satisfies requirements: 4.2, 4.3
   *
   * @param {string} id
   * @param {string} newText
   * @returns {string|null}  null on success, error string on validation failure.
   */
  editTask(id, newText) {
    const result = this._validate(newText, 500);

    if (!result.ok) {
      return result.error; // caller renders the inline error message
    }

    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null; // task not found — nothing to do

    task.description = newText.trim();
    this.editingId   = null; // exit edit mode

    // Persist — surface a banner if storage is unavailable (req 5.4)
    const writeResult = StorageUtil.write("tasks", this.tasks);
    if (!writeResult.ok) {
      this._showWriteError();
    } else {
      this._clearWriteError();
    }

    this.render();
    return null; // success
  },

  /**
   * Flips the `completed` boolean on the Task identified by `id`.
   * Persists the updated array to localStorage and re-renders.
   *
   * Satisfies requirements: 4.4, 4.5
   *
   * @param {string} id
   */
  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return; // guard: unknown id — no-op

    task.completed = !task.completed;

    // Persist — surface a banner if storage is unavailable (req 5.4)
    const writeResult = StorageUtil.write("tasks", this.tasks);
    if (!writeResult.ok) {
      this._showWriteError();
    } else {
      this._clearWriteError();
    }

    this.render();
  },

  /**
   * Permanently removes the Task identified by `id` from `tasks[]`.
   * Persists the updated array to localStorage and re-renders.
   *
   * Satisfies requirement: 4.6
   *
   * @param {string} id
   */
  deleteTask(id) {
    const originalLength = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);

    // Guard: if nothing was removed, skip persist + render
    if (this.tasks.length === originalLength) return;

    // Persist — surface a banner if storage is unavailable (req 5.4)
    const writeResult = StorageUtil.write("tasks", this.tasks);
    if (!writeResult.ok) {
      this._showWriteError();
    } else {
      this._clearWriteError();
    }

    this.render();
  },

  /**
   * Re-draws the entire task list from the current `tasks[]` state.
   * Each <li> contains the task text plus Done, Edit, and Delete buttons.
   * Completed tasks receive a `task-completed` class for strikethrough styling.
   * In edit mode (this.editingId === task.id) the task text is replaced with
   * a pre-filled <input> (full wire-up happens in task 7.5).
   *
   * Satisfies requirements: 3.2, 3.4, 3.5
   */
  render() {
    const ul = document.getElementById("todo-list");
    if (!ul) return;

    ul.innerHTML = ""; // clear previous render

    this.tasks.forEach((task) => {
      const li = document.createElement("li");

      // Visual distinction for completed tasks (req 3.5, 4.4)
      if (task.completed) {
        li.classList.add("task-completed");
      }

      if (this.editingId === task.id) {
        // ── Edit mode ─────────────────────────────────────────────────────
        const editInput = document.createElement("input");
        editInput.type      = "text";
        editInput.value     = task.description;
        editInput.maxLength = 500;
        editInput.className = "task-edit-input";
        editInput.setAttribute("aria-label", `Edit task "${task.description}"`);

        const editError = document.createElement("p");
        editError.className = "error-message";
        editError.setAttribute("role", "alert");
        editError.setAttribute("aria-live", "polite");

        // Track whether a confirm attempt is in flight so blur doesn't
        // double-fire after Enter already triggered editTask.
        let confirmed = false;

        /**
         * Attempt to confirm the edit.
         * Shows an inline error if validation fails; otherwise delegates to
         * editTask() which persists and re-renders.
         */
        const tryConfirm = () => {
          if (confirmed) return;
          const error = this.editTask(task.id, editInput.value);
          if (error) {
            // Validation failed — stay in edit mode, show the error
            editError.textContent = error;
            editInput.focus();
          } else {
            confirmed = true; // editTask re-rendered, nothing left to do
          }
        };

        /** Cancel edit and restore display mode without saving (req 4.1). */
        const cancel = () => {
          confirmed        = true; // prevent blur from firing tryConfirm
          this.editingId   = null;
          this.render();
        };

        // Confirm on Enter, cancel on Escape (req 4.1, 4.2, 4.3)
        editInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            tryConfirm();
          } else if (e.key === "Escape") {
            cancel();
          }
        });

        // Confirm on blur when a non-empty value is present (req 4.2)
        editInput.addEventListener("blur", () => {
          if (!confirmed) {
            tryConfirm();
          }
        });

        // Clear the inline error as the user types (req 4.3)
        editInput.addEventListener("input", () => {
          editError.textContent = "";
        });

        li.appendChild(editInput);
        li.appendChild(editError);

        // Auto-focus the input so the user can type immediately (req 4.1)
        // requestAnimationFrame ensures the element is in the DOM first.
        requestAnimationFrame(() => editInput.focus());
      } else {
        // ── Display mode ──────────────────────────────────────────────────

        // 1. Task text
        const span = document.createElement("span");
        span.className   = "task-text";
        span.textContent = task.description;

        // 2. Done/Undo toggle button
        const btnDone = document.createElement("button");
        btnDone.type        = "button";
        btnDone.className   = "btn-done";
        btnDone.textContent = task.completed ? "Undo" : "Done";
        btnDone.setAttribute(
          "aria-label",
          task.completed
            ? `Mark '${task.description}' as incomplete`
            : `Mark '${task.description}' as done`
        );
        btnDone.addEventListener("click", () => this.toggleTask(task.id));

        // 3. Edit button
        const btnEdit = document.createElement("button");
        btnEdit.type        = "button";
        btnEdit.className   = "btn-edit";
        btnEdit.textContent = "Edit";
        btnEdit.setAttribute("aria-label", `Edit task '${task.description}'`);
        btnEdit.addEventListener("click", () => {
          // Enter edit mode for this task; full confirmation logic in task 7.5
          this.editingId = task.id;
          this.render();
        });

        // 4. Delete button
        const btnDelete = document.createElement("button");
        btnDelete.type        = "button";
        btnDelete.className   = "btn-delete";
        btnDelete.textContent = "Delete";
        btnDelete.setAttribute("aria-label", `Delete task '${task.description}'`);
        btnDelete.addEventListener("click", () => this.deleteTask(task.id));

        li.appendChild(span);
        li.appendChild(btnDone);
        li.appendChild(btnEdit);
        li.appendChild(btnDelete);
      }

      ul.appendChild(li);
    });
  },

  /**
   * Wires up the todo form: handles submit (Add button + Enter key) and
   * clears the inline validation error whenever the user modifies the input.
   *
   * Satisfies requirements: 3.1, 3.2, 3.3
   */
  _initForm() {
    const form    = document.getElementById("todo-form");
    const inputEl = document.getElementById("todo-input");
    const errorEl = document.getElementById("todo-error");

    if (form) {
      // Both the Add button click and pressing Enter in the input
      // fire the "submit" event on the form (req 3.1, 3.2)
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.addTask(inputEl ? inputEl.value : "");
      });
    }

    if (inputEl && errorEl) {
      // Clear validation message as soon as the user starts typing (req 3.3)
      inputEl.addEventListener("input", () => {
        errorEl.textContent = "";
      });
    }
  },

  /**
   * Shows a load-failure banner above the task list.
   * Created once and reused if called again.
   *
   * Satisfies requirement: 5.5
   */
  _showLoadError() {
    const ul = document.getElementById("todo-list");
    if (!ul) return;

    let banner = document.getElementById("todo-load-error");
    if (!banner) {
      banner = document.createElement("p");
      banner.id        = "todo-load-error";
      banner.className = "error-message";
      banner.setAttribute("role", "alert");
      ul.parentNode.insertBefore(banner, ul);
    }
    banner.textContent = "Saved tasks could not be loaded. Starting with an empty list.";
  },

  /**
   * Bootstraps the TodoModule: reads persisted tasks from localStorage,
   * validates the loaded data, and renders the initial task list.
   *
   * - null result  → no prior data → empty list, no error (req 5.3)
   * - non-array    → corrupted data → empty list + load-error banner (req 5.5)
   * - valid array  → restore tasks and render (req 5.2)
   *
   * The write-failure banner (_showWriteError / _clearWriteError) is already
   * wired into addTask / editTask / toggleTask / deleteTask (req 5.4).
   *
   * Satisfies requirements: 5.2, 5.3, 5.4, 5.5
   */
  init() {
    this._initForm();

    const stored = StorageUtil.read("tasks");

    if (stored === null) {
      // No data in storage — fresh start, render empty list, no error (req 5.3)
      this.tasks = [];
    } else if (!Array.isArray(stored)) {
      // Data exists but is not a valid Task collection — discard and warn (req 5.5)
      this.tasks = [];
      this._showLoadError();
    } else {
      // Valid array — restore tasks (req 5.2)
      this.tasks = stored;
    }

    this.render();
  },
};
