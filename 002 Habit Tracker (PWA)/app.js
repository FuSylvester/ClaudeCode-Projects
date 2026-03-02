// Core data structures and state

/**
 * Habit model
 * @typedef {Object} Habit
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {number} targetDaysPerWeek
 * @property {number[]} daysOfWeek - 0 (Sunday) to 6 (Saturday)
 * @property {string} color
 * @property {string} createdAt - ISO date
 * @property {string | null} archivedAt - ISO date or null
 */

/**
 * Completion model
 * @typedef {Object} Completion
 * @property {string} habitId
 * @property {string} dateISO - YYYY-MM-DD
 * @property {boolean} completed
 */

/**
 * Settings model
 * @typedef {Object} Settings
 * @property {boolean} reminderEnabled
 * @property {string} defaultReminderTime - HH:MM
 * @property {"system" | "light" | "dark"} theme
 */

/**
 * @type {Habit[]}
 */
let habits = [];

/**
 * @type {Completion[]}
 */
let completions = [];

/**
 * @type {Settings}
 */
let settings = {
  reminderEnabled: true,
  defaultReminderTime: "20:00",
  theme: "system",
};

// Storage helpers

const STORAGE_KEYS = {
  habits: "habitTracker.habits",
  completions: "habitTracker.completions",
  settings: "habitTracker.settings",
};

function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.habits);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.error("Failed to load habits:", error);
    return [];
  }
}

function saveHabits(nextHabits) {
  habits = nextHabits;
  localStorage.setItem(STORAGE_KEYS.habits, JSON.stringify(habits));
}

function loadCompletions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.completions);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.error("Failed to load completions:", error);
    return [];
  }
}

function saveCompletions(nextCompletions) {
  completions = nextCompletions;
  localStorage.setItem(STORAGE_KEYS.completions, JSON.stringify(completions));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return { ...settings };
    const parsed = JSON.parse(raw);
    return {
      ...settings,
      ...parsed,
    };
  } catch (error) {
    console.error("Failed to load settings:", error);
    return { ...settings };
  }
}

function saveSettings(nextSettings) {
  settings = nextSettings;
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

// Date utilities

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateISO, delta) {
  const date = new Date(dateISO);
  date.setDate(date.getDate() + delta);
  return date.toISOString().slice(0, 10);
}

function getDayOfWeek(dateISO) {
  return new Date(dateISO).getDay();
}

// Habit helpers

function createHabitId() {
  return `habit_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

/**
 * Create a new Habit object from form values
 * @param {string} name
 * @param {string} description
 * @param {number} targetDaysPerWeek
 * @param {string} color
 * @returns {Habit}
 */
function makeHabit(name, description, targetDaysPerWeek, color) {
  const todayISO = getTodayISO();
  const clampedTarget = Math.min(7, Math.max(1, targetDaysPerWeek || 7));

  return {
    id: createHabitId(),
    name: name.trim(),
    description: description.trim(),
    targetDaysPerWeek: clampedTarget,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    color,
    createdAt: todayISO,
    archivedAt: null,
  };
}

function archiveHabit(habitId) {
  const todayISO = getTodayISO();
  const nextHabits = habits.map((habit) =>
    habit.id === habitId ? { ...habit, archivedAt: todayISO } : habit
  );
  saveHabits(nextHabits);
}

function upsertCompletion(habitId, dateISO, completed) {
  const existingIndex = completions.findIndex(
    (c) => c.habitId === habitId && c.dateISO === dateISO
  );

  const nextCompletions = [...completions];
  if (existingIndex === -1) {
    if (completed) {
      nextCompletions.push({ habitId, dateISO, completed: true });
    }
  } else {
    if (completed) {
      nextCompletions[existingIndex] = { habitId, dateISO, completed: true };
    } else {
      nextCompletions.splice(existingIndex, 1);
    }
  }

  saveCompletions(nextCompletions);
}

function isHabitCompletedOn(habitId, dateISO) {
  return completions.some(
    (c) => c.habitId === habitId && c.dateISO === dateISO && c.completed
  );
}

// Streak and statistics

function getCurrentStreak(habitId, todayISO) {
  let streak = 0;
  let cursor = todayISO;

  while (true) {
    const done = isHabitCompletedOn(habitId, cursor);
    if (!done) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function getBestStreak(habitId, lookbackDays) {
  const todayISO = getTodayISO();
  let best = 0;
  let current = 0;

  for (let offset = 0; offset < lookbackDays; offset += 1) {
    const dateISO = addDays(todayISO, -offset);
    const done = isHabitCompletedOn(habitId, dateISO);
    if (done) {
      current += 1;
      if (current > best) {
        best = current;
      }
    } else {
      current = 0;
    }
  }

  return best;
}

function getCompletionRate(habitId, windowDays) {
  const todayISO = getTodayISO();
  let completedCount = 0;

  for (let offset = 0; offset < windowDays; offset += 1) {
    const dateISO = addDays(todayISO, -offset);
    if (isHabitCompletedOn(habitId, dateISO)) {
      completedCount += 1;
    }
  }

  return windowDays === 0 ? 0 : completedCount / windowDays;
}

// DOM queries

const dom = {
  navToday: document.querySelector("#nav-today"),
  navStats: document.querySelector("#nav-stats"),
  todayView: document.querySelector("#today-view"),
  statsView: document.querySelector("#stats-view"),
  todayHabits: document.querySelector("#today-habits"),
  statsContent: document.querySelector("#stats-content"),
  openHabitFormButton: document.querySelector("#open-habit-form"),
  habitFormBackdrop: document.querySelector("#habit-form-backdrop"),
  habitForm: document.querySelector("#habit-form"),
  habitFormTitle: document.querySelector("#habit-form-title"),
  habitNameInput: document.querySelector("#habit-name-input"),
  habitDescriptionInput: document.querySelector("#habit-description-input"),
  habitTargetInput: document.querySelector("#habit-target-input"),
  habitColorInput: document.querySelector("#habit-color-input"),
  cancelHabitFormButton: document.querySelector("#cancel-habit-form"),
  reminderBanner: document.querySelector("#reminder-banner"),
};

let editingHabitId = null;

// Rendering

function renderTodayView() {
  const todayISO = getTodayISO();
  dom.todayHabits.innerHTML = "";

  const activeHabits = habits.filter((habit) => !habit.archivedAt);

  if (activeHabits.length === 0) {
    const empty = document.createElement("div");
    empty.className = "stats-summary";
    empty.textContent = "No habits yet. Add one to get started.";
    dom.todayHabits.appendChild(empty);
    return;
  }

  activeHabits.forEach((habit) => {
    const card = document.createElement("article");
    card.className = "habit-card";

    const colorPill = document.createElement("div");
    colorPill.className = "habit-color-pill";
    colorPill.style.background = habit.color || "var(--color-primary)";

    const main = document.createElement("div");
    main.className = "habit-main";

    const nameEl = document.createElement("div");
    nameEl.className = "habit-name";
    nameEl.textContent = habit.name;

    main.appendChild(nameEl);

    if (habit.description) {
      const desc = document.createElement("div");
      desc.className = "habit-description";
      desc.textContent = habit.description;
      main.appendChild(desc);
    }

    const meta = document.createElement("div");
    meta.className = "habit-meta";

    const streakPill = document.createElement("span");
    streakPill.className = "pill pill--streak";
    const streak = getCurrentStreak(habit.id, todayISO);
    streakPill.textContent = `Streak: ${streak} day${streak === 1 ? "" : "s"}`;

    const targetPill = document.createElement("span");
    targetPill.className = "pill pill--target";
    targetPill.textContent = `${habit.targetDaysPerWeek}x / week`;

    meta.appendChild(streakPill);
    meta.appendChild(targetPill);
    main.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "habit-actions";

    const completionToggle = document.createElement("label");
    completionToggle.className = "completion-toggle";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = isHabitCompletedOn(habit.id, todayISO);

    checkbox.addEventListener("change", () => {
      upsertCompletion(habit.id, todayISO, checkbox.checked);
      renderTodayView();
      renderStatsView();
    });

    const completionLabel = document.createElement("span");
    completionLabel.textContent = "Done today";

    completionToggle.appendChild(checkbox);
    completionToggle.appendChild(completionLabel);

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "icon-button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
      openHabitForm(habit);
    });

    const archiveButton = document.createElement("button");
    archiveButton.type = "button";
    archiveButton.className = "icon-button";
    archiveButton.textContent = "Archive";
    archiveButton.addEventListener("click", () => {
      archiveHabit(habit.id);
      renderTodayView();
      renderStatsView();
    });

    actions.appendChild(completionToggle);

    if (checkbox.checked) {
      const badge = document.createElement("span");
      badge.className = "badge-soft";
      badge.textContent = "Completed";
      actions.appendChild(badge);
    }

    actions.appendChild(editButton);
    actions.appendChild(archiveButton);

    card.appendChild(colorPill);
    card.appendChild(main);
    card.appendChild(actions);

    dom.todayHabits.appendChild(card);
  });
}

function renderStatsView() {
  const todayISO = getTodayISO();
  dom.statsContent.innerHTML = "";

  const activeHabits = habits.filter((habit) => !habit.archivedAt);

  const summary = document.createElement("section");
  summary.className = "stats-summary";

  const totalRow = document.createElement("div");
  totalRow.className = "stats-summary-row";
  totalRow.innerHTML = `<span>Total habits</span><span>${activeHabits.length}</span>`;
  summary.appendChild(totalRow);

  const todayCompleted = activeHabits.filter((habit) =>
    isHabitCompletedOn(habit.id, todayISO)
  ).length;
  const todayRow = document.createElement("div");
  todayRow.className = "stats-summary-row";
  todayRow.innerHTML = `<span>Done today</span><span>${todayCompleted}</span>`;
  summary.appendChild(todayRow);

  dom.statsContent.appendChild(summary);

  activeHabits.forEach((habit) => {
    const block = document.createElement("article");
    block.className = "stats-habit";

    const header = document.createElement("div");
    header.className = "stats-habit-header";

    const name = document.createElement("span");
    name.textContent = habit.name;

    const streakSpan = document.createElement("span");
    const streak = getCurrentStreak(habit.id, todayISO);
    const best = getBestStreak(habit.id, 60);
    streakSpan.textContent = `Streak ${streak} • Best ${best}`;
    streakSpan.style.fontSize = "0.75rem";
    streakSpan.style.color = "var(--color-muted)";

    header.appendChild(name);
    header.appendChild(streakSpan);

    const rateRow = document.createElement("div");
    rateRow.className = "stats-summary-row";
    const rateLabel = document.createElement("span");
    rateLabel.textContent = "Last 14 days";
    const rateValue = document.createElement("span");
    const rate = getCompletionRate(habit.id, 14);
    const percent = Math.round(rate * 100);
    rateValue.textContent = `${percent}%`;
    rateValue.style.fontSize = "0.75rem";
    rateValue.style.color = "var(--color-muted)";
    rateRow.appendChild(rateLabel);
    rateRow.appendChild(rateValue);

    const barOuter = document.createElement("div");
    barOuter.className = "stats-bar-outer";
    const barInner = document.createElement("div");
    barInner.className = "stats-bar-inner";
    barInner.style.width = `${percent}%`;
    barOuter.appendChild(barInner);

    block.appendChild(header);
    block.appendChild(rateRow);
    block.appendChild(barOuter);

    dom.statsContent.appendChild(block);
  });
}

// Habit form handling

function openHabitForm(habit) {
  if (habit) {
    editingHabitId = habit.id;
    dom.habitFormTitle.textContent = "Edit Habit";
    dom.habitNameInput.value = habit.name;
    dom.habitDescriptionInput.value = habit.description || "";
    dom.habitTargetInput.value = String(habit.targetDaysPerWeek || 7);
    dom.habitColorInput.value = habit.color || "#4f46e5";
  } else {
    editingHabitId = null;
    dom.habitFormTitle.textContent = "Add Habit";
    dom.habitNameInput.value = "";
    dom.habitDescriptionInput.value = "";
    dom.habitTargetInput.value = "7";
    dom.habitColorInput.value = "#4f46e5";
  }

  dom.habitFormBackdrop.classList.remove("modal-backdrop--hidden");
}

function closeHabitForm() {
  dom.habitFormBackdrop.classList.add("modal-backdrop--hidden");
}

function handleHabitFormSubmit(event) {
  event.preventDefault();

  const name = dom.habitNameInput.value;
  const description = dom.habitDescriptionInput.value;
  const target = Number(dom.habitTargetInput.value || "7");
  const color = dom.habitColorInput.value || "#4f46e5";

  if (!name.trim()) {
    return;
  }

  if (editingHabitId) {
    const nextHabits = habits.map((habit) =>
      habit.id === editingHabitId
        ? {
            ...habit,
            name: name.trim(),
            description: description.trim(),
            targetDaysPerWeek: Math.min(7, Math.max(1, target || 7)),
            color,
          }
        : habit
    );
    saveHabits(nextHabits);
  } else {
    const newHabit = makeHabit(name, description, target, color);
    saveHabits([...habits, newHabit]);
  }

  closeHabitForm();
  renderTodayView();
  renderStatsView();
}

// Navigation

function showTodayView() {
  dom.todayView.classList.add("view--active");
  dom.statsView.classList.remove("view--active");
  dom.navToday.classList.add("nav-button--active");
  dom.navStats.classList.remove("nav-button--active");
}

function showStatsView() {
  dom.todayView.classList.remove("view--active");
  dom.statsView.classList.add("view--active");
  dom.navToday.classList.remove("nav-button--active");
  dom.navStats.classList.add("nav-button--active");
}

// Reminders

function parseReminderHour(reminderTime) {
  const [h] = reminderTime.split(":");
  const hour = Number(h || "20");
  if (Number.isNaN(hour)) return 20;
  return Math.min(23, Math.max(0, hour));
}

function hasIncompleteHabitsToday() {
  const todayISO = getTodayISO();
  return habits.some(
    (habit) =>
      !habit.archivedAt && !isHabitCompletedOn(habit.id, todayISO)
  );
}

function checkReminders() {
  if (!settings.reminderEnabled) {
    dom.reminderBanner.classList.add("reminder-banner--hidden");
    return;
  }

  const now = new Date();
  const reminderHour = parseReminderHour(settings.defaultReminderTime);

  if (now.getHours() >= reminderHour && hasIncompleteHabitsToday()) {
    dom.reminderBanner.classList.remove("reminder-banner--hidden");
  } else {
    dom.reminderBanner.classList.add("reminder-banner--hidden");
  }
}

function enableReminders() {
  const nextSettings = {
    ...settings,
    reminderEnabled: true,
  };
  saveSettings(nextSettings);
  checkReminders();
}

function disableReminders() {
  const nextSettings = {
    ...settings,
    reminderEnabled: false,
  };
  saveSettings(nextSettings);
  checkReminders();
}

// PWA service worker registration

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker
    .register("service-worker.js")
    .catch((error) => {
      console.error("Service worker registration failed:", error);
    });
}

// Example tests to validate core utilities

function runExampleTests() {
  const today = "2024-01-10";
  const dates = [];
  for (let i = 0; i < 5; i += 1) {
    dates.push(addDays(today, -i));
  }

  if (dates.length !== 5) {
    console.warn("Date utility test: unexpected length");
  }
}

// Initialization

function init() {
  habits = loadHabits();
  completions = loadCompletions();
  settings = loadSettings();

  if (habits.length === 0) {
    const starterHabit = makeHabit(
      "Drink a glass of water",
      "Start the day hydrated",
      7,
      "#4f46e5"
    );
    saveHabits([starterHabit]);
  }

  dom.navToday.addEventListener("click", () => {
    showTodayView();
    renderTodayView();
  });

  dom.navStats.addEventListener("click", () => {
    showStatsView();
    renderStatsView();
  });

  dom.openHabitFormButton.addEventListener("click", () => openHabitForm(null));
  dom.cancelHabitFormButton.addEventListener("click", () => closeHabitForm());
  dom.habitForm.addEventListener("submit", handleHabitFormSubmit);

  renderTodayView();
  renderStatsView();
  showTodayView();

  checkReminders();
  setInterval(checkReminders, 60 * 1000);

  registerServiceWorker();
  runExampleTests();
}

document.addEventListener("DOMContentLoaded", init);

