const STORAGE_KEY = "pulse-habit-tracker-v1";
const DAY_MS = 24 * 60 * 60 * 1000;
const HEATMAP_DAYS = 30;
const DEFAULT_COLOR = "#5eead4";

const elements = {
  todayDate: document.getElementById("todayDate"),
  headerSummary: document.getElementById("headerSummary"),
  heroCompletionRate: document.getElementById("heroCompletionRate"),
  heroTodayCount: document.getElementById("heroTodayCount"),
  habitForm: document.getElementById("habitForm"),
  habitName: document.getElementById("habitName"),
  habitCategory: document.getElementById("habitCategory"),
  habitColor: document.getElementById("habitColor"),
  formMessage: document.getElementById("formMessage"),
  searchInput: document.getElementById("searchInput"),
  statusFilter: document.getElementById("statusFilter"),
  analyticsGrid: document.getElementById("analyticsGrid"),
  summaryStats: document.getElementById("summaryStats"),
  heatmapGrid: document.getElementById("heatmapGrid"),
  heatmapTooltip: document.getElementById("heatmapTooltip"),
  habitList: document.getElementById("habitList"),
  habitCardTemplate: document.getElementById("habitCardTemplate"),
};

const state = {
  habits: [],
  searchQuery: "",
  statusFilter: "all",
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  state.habits = loadHabits();
  bindEvents();
  setTodayLabel();
  renderApp();
}

function bindEvents() {
  elements.habitForm.addEventListener("submit", handleAddHabit);
  elements.searchInput.addEventListener("input", (event) => {
    state.searchQuery = event.target.value.trim().toLowerCase();
    renderHabits();
  });
  elements.statusFilter.addEventListener("change", (event) => {
    state.statusFilter = event.target.value;
    renderHabits();
  });
}

function loadHabits() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    const starterHabits = createStarterHabits();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(starterHabits));
    return starterHabits;
  }

  try {
    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeHabit);
  } catch (error) {
    console.error("Unable to load habits from localStorage:", error);
    return [];
  }
}

function saveHabits() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.habits));
}

// Normalize older or partial localStorage entries so the app can keep rendering safely.
function normalizeHabit(habit) {
  return {
    id: habit.id || String(Date.now()),
    name: (habit.name || "").trim(),
    createdAt: habit.createdAt || new Date().toISOString(),
    category: (habit.category || "Personal").trim(),
    color: habit.color || DEFAULT_COLOR,
    history: sanitizeHistory(habit.history),
  };
}

function sanitizeHistory(history) {
  if (!history || typeof history !== "object") {
    return {};
  }

  return Object.entries(history).reduce((accumulator, [dateKey, completed]) => {
    if (typeof completed === "boolean") {
      accumulator[dateKey] = completed;
    }

    return accumulator;
  }, {});
}

function createStarterHabits() {
  const today = formatDateKey(new Date());
  const yesterday = formatDateKey(addDays(new Date(), -1));
  const twoDaysAgo = formatDateKey(addDays(new Date(), -2));

  return [
    {
      id: createId(),
      name: "Morning stretch",
      createdAt: new Date().toISOString(),
      category: "Energy",
      color: "#5eead4",
      history: {
        [today]: true,
        [yesterday]: true,
        [twoDaysAgo]: true,
      },
    },
    {
      id: createId(),
      name: "Read 20 minutes",
      createdAt: new Date().toISOString(),
      category: "Mindset",
      color: "#38bdf8",
      history: {
        [today]: true,
        [twoDaysAgo]: true,
      },
    },
    {
      id: createId(),
      name: "Drink water goal",
      createdAt: new Date().toISOString(),
      category: "Health",
      color: "#6ee7b7",
      history: {
        [yesterday]: true,
      },
    },
  ];
}

// Form submit creates a habit record with a stable id and empty daily history.
function handleAddHabit(event) {
  event.preventDefault();

  const name = elements.habitName.value.trim();
  const category = elements.habitCategory.value.trim() || "Personal";
  const color = elements.habitColor.value || DEFAULT_COLOR;

  if (!name) {
    showFormMessage("Habit name cannot be empty.", true);
    elements.habitName.focus();
    return;
  }

  const newHabit = {
    id: createId(),
    name,
    createdAt: new Date().toISOString(),
    category,
    color,
    history: {},
  };

  state.habits.unshift(newHabit);
  persistAndRender();
  elements.habitForm.reset();
  elements.habitColor.value = DEFAULT_COLOR;
  showFormMessage(`"${name}" added to your routine.`);
  elements.habitForm.classList.add("pulse");

  window.setTimeout(() => {
    elements.habitForm.classList.remove("pulse");
  }, 1200);
}

function showFormMessage(message, isError = false) {
  elements.formMessage.textContent = message;
  elements.formMessage.style.color = isError ? "#fda4af" : "#a7f3d0";
}

function persistAndRender() {
  saveHabits();
  renderApp();
}

function renderApp() {
  renderAnalytics();
  renderSummaryCards();
  renderHeatmap();
  renderHabits();
  updateHeader();
}

// Top-level metrics keep the dashboard readable at a glance.
function renderAnalytics() {
  const stats = calculateAnalytics(state.habits);

  const cards = [
    {
      label: "Total habits",
      value: stats.totalHabits,
      trend: `${stats.completedToday} completed today`,
    },
    {
      label: "Total completions",
      value: stats.totalCompletions,
      trend: "Across all recorded history",
    },
    {
      label: "Completion rate",
      value: `${stats.completionRate}%`,
      trend: `Based on the last ${HEATMAP_DAYS} days`,
    },
    {
      label: "Best habit",
      value: stats.bestHabitName,
      trend: `${stats.bestHabitRate}% success over 30 days`,
    },
    {
      label: "Active streaks",
      value: stats.activeStreaks,
      trend: `${stats.longestCurrentStreak} day best current streak`,
    },
  ];

  elements.analyticsGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="metric-card">
          <span class="metric-label">${escapeHtml(card.label)}</span>
          <strong class="metric-value">${escapeHtml(String(card.value))}</strong>
          <p class="metric-trend">${escapeHtml(card.trend)}</p>
        </article>
      `
    )
    .join("");
}

function renderSummaryCards() {
  const last7Days = getDailyTotals(7);
  const last30Days = getDailyTotals(HEATMAP_DAYS);
  const weeklyTotal = last7Days.reduce((sum, item) => sum + item.count, 0);
  const weeklyPeak = Math.max(0, ...last7Days.map((item) => item.count));
  const consistencyDays = last30Days.filter((item) => item.count > 0).length;
  const averagePerDay = last30Days.length
    ? (last30Days.reduce((sum, item) => sum + item.count, 0) / last30Days.length).toFixed(1)
    : "0.0";

  elements.summaryStats.innerHTML = `
    <article class="summary-card">
      <span class="summary-label">Weekly completions</span>
      <strong class="summary-value">${weeklyTotal}</strong>
      ${renderMiniBars(last7Days, weeklyPeak)}
    </article>
    <article class="summary-card">
      <span class="summary-label">Consistency days</span>
      <strong class="summary-value">${consistencyDays} / ${HEATMAP_DAYS}</strong>
      <p class="metric-trend">Days with at least one completed habit</p>
    </article>
    <article class="summary-card">
      <span class="summary-label">Daily average</span>
      <strong class="summary-value">${averagePerDay}</strong>
      <p class="metric-trend">Average completed habits per day in the last 30 days</p>
    </article>
    <article class="summary-card">
      <span class="summary-label">Weekly peak</span>
      <strong class="summary-value">${weeklyPeak}</strong>
      <p class="metric-trend">Highest single-day completion total this week</p>
    </article>
  `;
}

function renderMiniBars(days, peak) {
  const safePeak = peak || 1;
  const bars = days
    .map((day) => {
      const height = Math.max(10, Math.round((day.count / safePeak) * 56));
      return `<span class="mini-bar" style="height:${height}px" title="${escapeHtml(
        `${formatShortDate(day.date)}: ${day.count} completions`
      )}"></span>`;
    })
    .join("");

  return `<div class="mini-bar-group" aria-hidden="true">${bars}</div>`;
}

function renderHeatmap() {
  const totals = getDailyTotals(HEATMAP_DAYS);
  const maxCount = Math.max(0, ...totals.map((item) => item.count));

  elements.heatmapGrid.innerHTML = "";

  totals.forEach((item) => {
    const cell = document.createElement("button");
    const intensity = getHeatLevel(item.count, maxCount);
    const formattedDate = formatLongDate(item.date);
    const tooltipText = `${formattedDate}: ${item.count} completed habit${item.count === 1 ? "" : "s"}`;

    cell.type = "button";
    cell.className = `heatmap-cell level-${intensity}`;
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-label", tooltipText);
    cell.innerHTML = `
      <small>${escapeHtml(formatWeekday(item.date))}</small>
      <strong>${item.count}</strong>
      <small>${escapeHtml(formatCompactDate(item.date))}</small>
    `;
    cell.style.background = `linear-gradient(180deg, ${getHeatColor(intensity)}, rgba(255,255,255,0.03))`;

    cell.addEventListener("mouseenter", (event) => {
      showTooltip(event, `${formattedDate}<br>${item.count} completed habit${item.count === 1 ? "" : "s"}`);
    });
    cell.addEventListener("mousemove", (event) => {
      moveTooltip(event);
    });
    cell.addEventListener("mouseleave", hideTooltip);
    cell.addEventListener("focus", (event) => {
      showTooltip(event, `${formattedDate}<br>${item.count} completed habit${item.count === 1 ? "" : "s"}`);
    });
    cell.addEventListener("blur", hideTooltip);

    elements.heatmapGrid.appendChild(cell);
  });
}

function renderHabits() {
  const filteredHabits = getFilteredHabits();

  if (!filteredHabits.length) {
    const isFiltering = Boolean(state.searchQuery) || state.statusFilter !== "all";
    elements.habitList.innerHTML = `
      <div class="empty-state">
        <h3>${isFiltering ? "No habits match this view" : "No habits yet"}</h3>
        <p>${
          isFiltering
            ? "Try a different search or add a new habit to keep momentum moving."
            : "Add your first habit to start building streaks and filling the heatmap."
        }</p>
      </div>
    `;
    return;
  }

  elements.habitList.innerHTML = "";

  filteredHabits.forEach((habit) => {
    const fragment = elements.habitCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".habit-card");
    const accent = fragment.querySelector(".habit-accent");
    const category = fragment.querySelector(".habit-category");
    const title = fragment.querySelector(".habit-title");
    const toggleButton = fragment.querySelector(".habit-toggle");
    const currentStreak = fragment.querySelector(".current-streak");
    const longestStreak = fragment.querySelector(".longest-streak");
    const habitRate = fragment.querySelector(".habit-rate");
    const editButton = fragment.querySelector(".edit-btn");
    const deleteButton = fragment.querySelector(".delete-btn");
    const completedToday = isHabitCompleteOnDate(habit, formatDateKey(new Date()));
    const streaks = calculateStreaks(habit);

    accent.style.background = habit.color;
    accent.style.boxShadow = `0 0 28px ${hexToRgba(habit.color, 0.45)}`;
    category.textContent = habit.category || "Personal";
    title.textContent = habit.name;
    currentStreak.textContent = `${streaks.current} day${streaks.current === 1 ? "" : "s"}`;
    longestStreak.textContent = `${streaks.longest} day${streaks.longest === 1 ? "" : "s"}`;
    habitRate.textContent = `${calculateHabitCompletionRate(habit)}%`;

    toggleButton.textContent = completedToday ? "Completed today" : "Mark today";
    toggleButton.classList.toggle("is-complete", completedToday);
    toggleButton.addEventListener("click", () => toggleHabitCompletion(habit.id));

    editButton.addEventListener("click", () => editHabit(habit.id));
    deleteButton.addEventListener("click", () => deleteHabit(habit.id));

    card.style.borderColor = hexToRgba(habit.color, 0.24);
    elements.habitList.appendChild(fragment);
  });
}

function getFilteredHabits() {
  return state.habits.filter((habit) => {
    const searchText = `${habit.name} ${habit.category}`.toLowerCase();
    const matchesSearch = !state.searchQuery || searchText.includes(state.searchQuery);
    const completedToday = isHabitCompleteOnDate(habit, formatDateKey(new Date()));

    if (state.statusFilter === "completed" && !completedToday) {
      return false;
    }

    if (state.statusFilter === "pending" && completedToday) {
      return false;
    }

    return matchesSearch;
  });
}

function toggleHabitCompletion(habitId) {
  const today = formatDateKey(new Date());
  const habit = state.habits.find((item) => item.id === habitId);

  if (!habit) {
    return;
  }

  const currentValue = Boolean(habit.history[today]);
  habit.history[today] = !currentValue;

  if (!habit.history[today]) {
    delete habit.history[today];
  }

  persistAndRender();
}

function editHabit(habitId) {
  const habit = state.habits.find((item) => item.id === habitId);

  if (!habit) {
    return;
  }

  const nextName = window.prompt("Edit habit name:", habit.name);

  if (nextName === null) {
    return;
  }

  const trimmedName = nextName.trim();

  if (!trimmedName) {
    window.alert("Habit name cannot be empty.");
    return;
  }

  const nextCategory = window.prompt("Edit category:", habit.category || "Personal");
  habit.name = trimmedName;

  if (nextCategory !== null) {
    habit.category = nextCategory.trim() || "Personal";
  }

  persistAndRender();
}

function deleteHabit(habitId) {
  const habit = state.habits.find((item) => item.id === habitId);

  if (!habit) {
    return;
  }

  const confirmed = window.confirm(`Delete "${habit.name}"? This will remove its full history.`);

  if (!confirmed) {
    return;
  }

  state.habits = state.habits.filter((item) => item.id !== habitId);
  persistAndRender();
}

function calculateAnalytics(habits) {
  const totalHabits = habits.length;
  const totalCompletions = habits.reduce((sum, habit) => sum + Object.keys(habit.history).length, 0);
  const last30Days = getDailyTotals(HEATMAP_DAYS);
  const completedToday = last30Days[last30Days.length - 1]?.count || 0;
  const possibleCompletions = totalHabits * HEATMAP_DAYS;
  const completionsInWindow = last30Days.reduce((sum, item) => sum + item.count, 0);
  const completionRate = possibleCompletions
    ? Math.round((completionsInWindow / possibleCompletions) * 100)
    : 0;

  let bestHabitName = "No data yet";
  let bestHabitRate = 0;
  let activeStreaks = 0;
  let longestCurrentStreak = 0;

  habits.forEach((habit) => {
    const rate = calculateHabitCompletionRate(habit);
    const streaks = calculateStreaks(habit);

    if (rate > bestHabitRate) {
      bestHabitRate = rate;
      bestHabitName = habit.name;
    }

    if (streaks.current > 0) {
      activeStreaks += 1;
    }

    if (streaks.current > longestCurrentStreak) {
      longestCurrentStreak = streaks.current;
    }
  });

  return {
    totalHabits,
    totalCompletions,
    completionRate,
    completedToday,
    bestHabitName,
    bestHabitRate,
    activeStreaks,
    longestCurrentStreak,
  };
}

function calculateHabitCompletionRate(habit) {
  const days = getDateRange(HEATMAP_DAYS);
  const completedCount = days.filter((date) => isHabitCompleteOnDate(habit, formatDateKey(date))).length;
  return Math.round((completedCount / HEATMAP_DAYS) * 100);
}

function calculateStreaks(habit) {
  const dates = Object.keys(habit.history)
    .filter((dateKey) => habit.history[dateKey])
    .sort();

  if (!dates.length) {
    return { current: 0, longest: 0 };
  }

  // Longest streak scans the full completion history in chronological order.
  let longest = 1;
  let running = 1;

  for (let index = 1; index < dates.length; index += 1) {
    const previous = parseDateKey(dates[index - 1]);
    const current = parseDateKey(dates[index]);
    const difference = getDayDifference(previous, current);

    if (difference === 1) {
      running += 1;
      longest = Math.max(longest, running);
    } else if (difference > 1) {
      running = 1;
    }
  }

  // Current streak only counts backwards from today with no gaps.
  let currentStreak = 0;
  let cursor = new Date();

  while (true) {
    const key = formatDateKey(cursor);
    if (habit.history[key]) {
      currentStreak += 1;
      cursor = addDays(cursor, -1);
      continue;
    }
    break;
  }

  return {
    current: currentStreak,
    longest,
  };
}

function getDailyTotals(daysCount) {
  return getDateRange(daysCount).map((date) => {
    const dateKey = formatDateKey(date);
    const count = state.habits.reduce((sum, habit) => sum + (habit.history[dateKey] ? 1 : 0), 0);

    return {
      date,
      dateKey,
      count,
    };
  });
}

// Build a rolling day range ending today so the heatmap and summary cards stay aligned.
function getDateRange(daysCount) {
  return Array.from({ length: daysCount }, (_, index) => addDays(new Date(), index - (daysCount - 1)));
}

function isHabitCompleteOnDate(habit, dateKey) {
  return Boolean(habit.history[dateKey]);
}

function updateHeader() {
  const totalHabits = state.habits.length;
  const todayKey = formatDateKey(new Date());
  const completedToday = state.habits.filter((habit) => habit.history[todayKey]).length;
  const completionRate = calculateAnalytics(state.habits).completionRate;

  elements.headerSummary.textContent = `${totalHabits} habit${totalHabits === 1 ? "" : "s"} in motion`;
  elements.heroTodayCount.textContent = `${completedToday} / ${totalHabits}`;
  elements.heroCompletionRate.textContent = `${completionRate}%`;
}

function setTodayLabel() {
  elements.todayDate.textContent = formatLongDate(new Date());
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function formatDateKey(date) {
  const normalized = new Date(date);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, "0");
  const day = String(normalized.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

function addDays(date, offset) {
  const result = new Date(date);
  result.setHours(12, 0, 0, 0);
  result.setDate(result.getDate() + offset);
  return result;
}

function getDayDifference(previous, current) {
  const previousMid = Date.UTC(previous.getFullYear(), previous.getMonth(), previous.getDate());
  const currentMid = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
  return Math.round((currentMid - previousMid) / DAY_MS);
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function formatCompactDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(new Date(date));
}

function formatWeekday(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(new Date(date));
}

function getHeatLevel(count, maxCount) {
  if (count === 0 || maxCount === 0) {
    return 0;
  }

  const ratio = count / maxCount;

  if (ratio < 0.26) {
    return 1;
  }

  if (ratio < 0.51) {
    return 2;
  }

  if (ratio < 0.76) {
    return 3;
  }

  return 4;
}

function getHeatColor(level) {
  const colors = {
    0: "rgba(255,255,255,0.05)",
    1: "rgba(94, 234, 212, 0.18)",
    2: "rgba(94, 234, 212, 0.32)",
    3: "rgba(56, 189, 248, 0.42)",
    4: "rgba(110, 231, 183, 0.72)",
  };

  return colors[level];
}

function showTooltip(event, content) {
  elements.heatmapTooltip.innerHTML = content;
  elements.heatmapTooltip.hidden = false;
  moveTooltip(event);
}

function moveTooltip(event) {
  const tooltip = elements.heatmapTooltip;
  const wrapperBounds = tooltip.parentElement.getBoundingClientRect();
  const clientX = event.clientX ?? event.target.getBoundingClientRect().left;
  const clientY = event.clientY ?? event.target.getBoundingClientRect().top;
  const left = clientX - wrapperBounds.left + 14;
  const top = clientY - wrapperBounds.top - 14;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideTooltip() {
  elements.heatmapTooltip.hidden = true;
}

function hexToRgba(hex, alpha) {
  const sanitized = hex.replace("#", "");
  const normalized = sanitized.length === 3
    ? sanitized
        .split("")
        .map((char) => char + char)
        .join("")
    : sanitized;
  const numeric = Number.parseInt(normalized, 16);
  const red = (numeric >> 16) & 255;
  const green = (numeric >> 8) & 255;
  const blue = numeric & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
