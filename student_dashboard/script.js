const STORAGE_KEY = "studentProductivityDashboardState";
const charts = {};
const statusOrder = ["todo", "progress", "completed"];
const statusLabels = {
  todo: "To Do",
  progress: "In Progress",
  completed: "Completed",
};
const modeLabels = {
  focus: "Focus session",
  shortBreak: "Short break",
  longBreak: "Long break",
};

let state = null;
let heartbeatInterval = null;

const elements = {
  body: document.body,
  navLinks: document.querySelectorAll(".nav-link"),
  sections: document.querySelectorAll(".section"),
  sectionTitle: document.getElementById("section-title"),
  currentDate: document.getElementById("current-date"),
  currentTime: document.getElementById("current-time"),
  themeToggle: document.getElementById("theme-toggle"),
  themeToggleSettings: document.getElementById("theme-toggle-settings"),
  themeLabel: document.getElementById("theme-label"),
  overviewStats: document.getElementById("overview-stats"),
  progressRings: document.getElementById("progress-rings"),
  overviewDeadlines: document.getElementById("overview-deadlines"),
  focusTitle: document.getElementById("focus-title"),
  focusCopy: document.getElementById("focus-copy"),
  taskBoard: document.getElementById("task-board"),
  taskFilterSubject: document.getElementById("task-filter-subject"),
  taskFilterPriority: document.getElementById("task-filter-priority"),
  taskFilterStatus: document.getElementById("task-filter-status"),
  deadlineList: document.getElementById("deadline-list"),
  attendanceList: document.getElementById("attendance-list"),
  analyticsInsights: document.getElementById("analytics-insights"),
  toastStack: document.getElementById("toast-stack"),
  pomodoroLabel: document.getElementById("pomodoro-label"),
  pomodoroTime: document.getElementById("pomodoro-time"),
  pomodoroHelper: document.getElementById("pomodoro-helper"),
  pomodoroSessionCount: document.getElementById("pomodoro-session-count"),
  pomodoroTotalHours: document.getElementById("pomodoro-total-hours"),
  pomodoroNextStep: document.getElementById("pomodoro-next-step"),
  modeButtons: document.querySelectorAll(".mode-chip"),
  settingsForm: document.getElementById("settings-form"),
  focusDuration: document.getElementById("focus-duration"),
  shortBreakDuration: document.getElementById("short-break-duration"),
  longBreakDuration: document.getElementById("long-break-duration"),
  attendanceThreshold: document.getElementById("attendance-threshold"),
  taskModal: document.getElementById("task-modal"),
  taskModalTitle: document.getElementById("task-modal-title"),
  taskForm: document.getElementById("task-form"),
  taskId: document.getElementById("task-id"),
  taskTitle: document.getElementById("task-title"),
  taskSubject: document.getElementById("task-subject"),
  taskPriority: document.getElementById("task-priority"),
  taskDueDate: document.getElementById("task-due-date"),
  taskStatus: document.getElementById("task-status"),
  taskNotes: document.getElementById("task-notes"),
  deadlineModal: document.getElementById("deadline-modal"),
  deadlineModalTitle: document.getElementById("deadline-modal-title"),
  deadlineForm: document.getElementById("deadline-form"),
  deadlineId: document.getElementById("deadline-id"),
  deadlineTitle: document.getElementById("deadline-title"),
  deadlineSubject: document.getElementById("deadline-subject"),
  deadlineDueDate: document.getElementById("deadline-due-date"),
  subjectModal: document.getElementById("subject-modal"),
  subjectModalTitle: document.getElementById("subject-modal-title"),
  subjectForm: document.getElementById("subject-form"),
  subjectId: document.getElementById("subject-id"),
  subjectName: document.getElementById("subject-name"),
  subjectTotal: document.getElementById("subject-total"),
  subjectAttended: document.getElementById("subject-attended"),
};

document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
  state = loadState();
  reconcilePomodoroOnLoad();
  bindEvents();
  applyTheme();
  syncSettingsForm();
  renderApp();
  startHeartbeat();
}

function bindEvents() {
  elements.navLinks.forEach((button) => {
    button.addEventListener("click", () => setActiveSection(button.dataset.section));
  });

  document.querySelectorAll("[data-section-jump]").forEach((button) => {
    button.addEventListener("click", () => setActiveSection(button.dataset.sectionJump));
  });

  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.themeToggleSettings.addEventListener("click", toggleTheme);

  document.getElementById("add-task-btn").addEventListener("click", () => openTaskModal());
  document.getElementById("add-deadline-btn").addEventListener("click", () => openDeadlineModal());
  document.getElementById("add-subject-btn").addEventListener("click", () => openSubjectModal());
  document.getElementById("pomodoro-start").addEventListener("click", startPomodoro);
  document.getElementById("pomodoro-pause").addEventListener("click", pausePomodoro);
  document.getElementById("pomodoro-reset").addEventListener("click", resetPomodoro);
  document.getElementById("clear-data-btn").addEventListener("click", clearAllData);

  elements.modeButtons.forEach((button) => {
    button.addEventListener("click", () => setPomodoroMode(button.dataset.mode, true));
  });

  elements.taskFilterSubject.addEventListener("change", renderTasks);
  elements.taskFilterPriority.addEventListener("change", renderTasks);
  elements.taskFilterStatus.addEventListener("change", renderTasks);

  elements.settingsForm.addEventListener("submit", handleSettingsSubmit);
  elements.taskForm.addEventListener("submit", handleTaskSubmit);
  elements.deadlineForm.addEventListener("submit", handleDeadlineSubmit);
  elements.subjectForm.addEventListener("submit", handleSubjectSubmit);

  document.addEventListener("click", handleDocumentClick);

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal("task-modal");
      closeModal("deadline-modal");
      closeModal("subject-modal");
    }
  });
}

function handleDocumentClick(event) {
  const actionButton = event.target.closest("[data-action]");
  const closeButton = event.target.closest("[data-close-modal]");

  if (closeButton) {
    closeModal(closeButton.dataset.closeModal);
    return;
  }

  if (!actionButton) {
    return;
  }

  const { action, id, status } = actionButton.dataset;

  if (action === "edit-task") openTaskModal(id);
  if (action === "delete-task") deleteTask(id);
  if (action === "move-task") updateTaskStatus(id, status);
  if (action === "edit-deadline") openDeadlineModal(id);
  if (action === "delete-deadline") deleteDeadline(id);
  if (action === "mark-present") updateAttendance(id, true);
  if (action === "mark-absent") updateAttendance(id, false);
  if (action === "edit-subject") openSubjectModal(id);
  if (action === "delete-subject") deleteSubject(id);
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      const seededState = createSampleState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seededState));
      return seededState;
    }

    return normalizeState(JSON.parse(saved));
  } catch (error) {
    console.error("Failed to load saved dashboard state:", error);
    return createSampleState();
  }
}

function normalizeState(savedState) {
  const baseState = createEmptyState(savedState?.theme || "dark");
  const normalized = {
    ...baseState,
    ...savedState,
    settings: {
      ...baseState.settings,
      ...(savedState?.settings || {}),
    },
    pomodoro: {
      ...baseState.pomodoro,
      ...(savedState?.pomodoro || {}),
    },
    tasks: Array.isArray(savedState?.tasks) ? savedState.tasks : [],
    deadlines: Array.isArray(savedState?.deadlines) ? savedState.deadlines : [],
    attendance: Array.isArray(savedState?.attendance) ? savedState.attendance : [],
    studyLog: Array.isArray(savedState?.studyLog) ? savedState.studyLog : [],
    ui: {
      ...baseState.ui,
      ...(savedState?.ui || {}),
    },
  };

  if (!modeLabels[normalized.pomodoro.mode]) {
    normalized.pomodoro.mode = "focus";
  }

  normalized.pomodoro.remainingSeconds = Number.isFinite(Number(normalized.pomodoro.remainingSeconds))
    ? Number(normalized.pomodoro.remainingSeconds)
    : normalized.settings.focusDuration * 60;

  return normalized;
}

function createEmptyState(theme = "dark") {
  return {
    theme,
    settings: {
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 20,
      attendanceThreshold: 75,
    },
    tasks: [],
    deadlines: [],
    attendance: [],
    studyLog: [],
    pomodoro: {
      mode: "focus",
      remainingSeconds: 25 * 60,
      isRunning: false,
      completedSessions: 0,
      totalFocusMinutes: 0,
      lastTickAt: null,
    },
    ui: {
      activeSection: "overview",
    },
  };
}

function createSampleState() {
  const sampleState = createEmptyState("dark");
  const now = new Date();
  const dateIn = (daysOffset, hoursOffset) => {
    const date = new Date(now);
    date.setDate(date.getDate() + daysOffset);
    date.setHours(date.getHours() + hoursOffset, 0, 0, 0);
    return date.toISOString();
  };

  sampleState.tasks = [
    {
      id: createId(),
      title: "Finish calculus problem set",
      subject: "Mathematics",
      priority: "high",
      dueDate: dateIn(1, 4),
      status: "todo",
      notes: "Review integration shortcuts before submission.",
    },
    {
      id: createId(),
      title: "Prepare chemistry lab report",
      subject: "Chemistry",
      priority: "medium",
      dueDate: dateIn(2, 6),
      status: "progress",
      notes: "Add charts for the titration results section.",
    },
    {
      id: createId(),
      title: "Revise World War II essay outline",
      subject: "History",
      priority: "low",
      dueDate: dateIn(3, 2),
      status: "completed",
      notes: "Draft is ready. Polish citations tonight.",
    },
    {
      id: createId(),
      title: "Build DSA practice streak",
      subject: "Computer Science",
      priority: "high",
      dueDate: dateIn(0, 8),
      status: "progress",
      notes: "Finish 3 graph problems before dinner.",
    },
    {
      id: createId(),
      title: "Read macroeconomics chapter 6",
      subject: "Economics",
      priority: "medium",
      dueDate: dateIn(4, 5),
      status: "todo",
      notes: "",
    },
  ];

  sampleState.deadlines = [
    { id: createId(), title: "Linear Algebra Quiz", subject: "Mathematics", dueDate: dateIn(0, 18) },
    { id: createId(), title: "Operating Systems Mini Project", subject: "Computer Science", dueDate: dateIn(2, 12) },
    { id: createId(), title: "Chemistry Viva", subject: "Chemistry", dueDate: dateIn(5, 9) },
    { id: createId(), title: "History Reflection Submission", subject: "History", dueDate: dateIn(-1, 7) },
  ];

  sampleState.attendance = [
    { id: createId(), subject: "Mathematics", totalClasses: 42, attendedClasses: 35 },
    { id: createId(), subject: "Computer Science", totalClasses: 38, attendedClasses: 33 },
    { id: createId(), subject: "Chemistry", totalClasses: 30, attendedClasses: 21 },
    { id: createId(), subject: "Economics", totalClasses: 28, attendedClasses: 24 },
  ];

  sampleState.studyLog = Array.from({ length: 7 }, (_, index) => {
    const entryDate = new Date(now);
    entryDate.setDate(now.getDate() - (6 - index));
    return {
      date: formatDateKey(entryDate),
      minutes: [75, 120, 60, 150, 95, 180, 110][index],
    };
  });

  sampleState.pomodoro.completedSessions = 11;
  sampleState.pomodoro.totalFocusMinutes = sampleState.studyLog.reduce((sum, item) => sum + item.minutes, 0);
  sampleState.pomodoro.remainingSeconds = sampleState.settings.focusDuration * 60;

  return sampleState;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function renderApp() {
  setActiveSection(state.ui.activeSection || "overview", false);
  renderOverview();
  renderTaskFilterSubjects();
  renderTasks();
  renderDeadlines();
  renderPomodoro();
  renderAttendance();
  renderAnalytics();
}

function setActiveSection(sectionName, shouldSave = true) {
  state.ui.activeSection = sectionName;
  elements.sections.forEach((section) => {
    section.classList.toggle("active", section.dataset.section === sectionName);
  });

  elements.navLinks.forEach((button) => {
    button.classList.toggle("active", button.dataset.section === sectionName);
  });

  elements.sectionTitle.textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
  if (shouldSave) saveState();
}

function renderOverview() {
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter((task) => task.status === "completed").length;
  const upcomingDeadlines = getSortedDeadlines().filter((deadline) => new Date(deadline.dueDate) > new Date()).length;
  const attendancePercentage = getOverallAttendance();
  const weeklyStudyHours = (getWeeklyStudyMinutes() / 60).toFixed(1);
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    { label: "Total Tasks", value: totalTasks, progress: totalTasks ? 100 : 0, helper: "Across all courses" },
    { label: "Completed Tasks", value: completedTasks, progress: completionRate, helper: `${completionRate}% completion rate` },
    { label: "Upcoming Deadlines", value: upcomingDeadlines, progress: Math.min(upcomingDeadlines * 20, 100), helper: "Nearest items highlighted" },
    { label: "Attendance", value: `${attendancePercentage}%`, progress: attendancePercentage, helper: "Weighted across subjects" },
    { label: "Study Hours", value: `${weeklyStudyHours}h`, progress: Math.min(Math.round((Number(weeklyStudyHours) / 20) * 100), 100), helper: "This week’s focus time" },
  ];

  elements.overviewStats.innerHTML = stats
    .map(
      (stat) => `
        <article class="stat-card">
          <p class="eyebrow">${stat.label}</p>
          <strong>${stat.value}</strong>
          <div class="stat-progress" style="--progress:${stat.progress}%;">
            <span></span>
          </div>
          <p class="muted-copy">${stat.helper}</p>
        </article>
      `
    )
    .join("");

  elements.progressRings.innerHTML = [
    {
      label: "Task Completion",
      value: completionRate,
      description: completedTasks ? `${completedTasks} finished tasks` : "Start by finishing your first task",
    },
    {
      label: "Attendance Health",
      value: attendancePercentage,
      description: `${state.attendance.length} tracked subjects`,
    },
  ]
    .map(
      (ring) => `
        <div class="progress-ring-card">
          <div class="progress-ring" style="--percentage:${ring.value}%;">
            <span>${ring.value}%</span>
          </div>
          <div>
            <strong>${ring.label}</strong>
            <p class="muted-copy">${ring.description}</p>
          </div>
        </div>
      `
    )
    .join("");

  const nextDeadlines = getSortedDeadlines().slice(0, 3);
  elements.overviewDeadlines.innerHTML = nextDeadlines.length
    ? nextDeadlines
        .map((deadline) => {
          const countdown = getCountdown(deadline.dueDate);
          return `
            <div class="mini-deadline-item">
              <strong>${escapeHtml(deadline.title)}</strong>
              <div class="task-meta">
                <span class="tag" style="--tag-color:${getSubjectColor(deadline.subject)};">${escapeHtml(deadline.subject)}</span>
                <span class="deadline-pill ${countdown.status}">${countdown.label}</span>
              </div>
              <p class="muted-copy">${formatReadableDate(deadline.dueDate)}</p>
            </div>
          `;
        })
        .join("")
    : createEmptyStateMarkup("No deadlines yet", "Add important dates to keep your academic calendar visible.");

  const focusData = getTodayFocusMessage();
  elements.focusTitle.textContent = focusData.title;
  elements.focusCopy.textContent = focusData.copy;
}

function renderTaskFilterSubjects() {
  const subjects = [...new Set(state.tasks.map((task) => task.subject.trim()).filter(Boolean))].sort();
  const currentValue = elements.taskFilterSubject.value || "all";
  elements.taskFilterSubject.innerHTML = `<option value="all">All subjects</option>${subjects
    .map((subject) => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`)
    .join("")}`;
  elements.taskFilterSubject.value = subjects.includes(currentValue) ? currentValue : "all";
}

function renderTasks() {
  const subjectFilter = elements.taskFilterSubject.value || "all";
  const priorityFilter = elements.taskFilterPriority.value || "all";
  const statusFilter = elements.taskFilterStatus.value || "all";

  const filteredTasks = state.tasks.filter((task) => {
    const subjectMatch = subjectFilter === "all" || task.subject === subjectFilter;
    const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
    const statusMatch = statusFilter === "all" || task.status === statusFilter;
    return subjectMatch && priorityMatch && statusMatch;
  });

  elements.taskBoard.innerHTML = statusOrder
    .map((status) => {
      const tasks = filteredTasks
        .filter((task) => task.status === status)
        .sort((first, second) => new Date(first.dueDate) - new Date(second.dueDate));

      const content = tasks.length
        ? tasks.map(renderTaskCard).join("")
        : createEmptyStateMarkup("No tasks here", "Tasks matching your filters will appear in this column.");

      return `
        <article class="task-column">
          <div class="task-column-header">
            <div>
              <p class="eyebrow">${statusLabels[status]}</p>
              <h3>${statusLabels[status]}</h3>
            </div>
            <span class="column-count">${tasks.length}</span>
          </div>
          <div class="task-list">${content}</div>
        </article>
      `;
    })
    .join("");
}

function renderTaskCard(task) {
  const currentStatusIndex = statusOrder.indexOf(task.status);
  const dueState = getCountdown(task.dueDate);
  const previousStatus = statusOrder[currentStatusIndex - 1];
  const nextStatus = statusOrder[currentStatusIndex + 1];

  return `
    <article class="task-card">
      <div class="task-card-header">
        <div>
          <strong>${escapeHtml(task.title)}</strong>
          <p class="muted-copy">${formatReadableDate(task.dueDate)}</p>
        </div>
        <span class="status-pill">${statusLabels[task.status]}</span>
      </div>

      <div class="task-meta">
        <span class="tag" style="--tag-color:${getSubjectColor(task.subject)};">${escapeHtml(task.subject)}</span>
        <span class="priority-pill ${task.priority}">${capitalize(task.priority)}</span>
        <span class="deadline-pill ${dueState.status}">${dueState.label}</span>
      </div>

      <p class="task-notes">${escapeHtml(task.notes || "No notes added yet.")}</p>

      <div class="task-actions">
        ${previousStatus ? `<button class="ghost-btn" data-action="move-task" data-id="${task.id}" data-status="${previousStatus}" type="button">Move Back</button>` : ""}
        ${nextStatus ? `<button class="ghost-btn" data-action="move-task" data-id="${task.id}" data-status="${nextStatus}" type="button">Move Forward</button>` : ""}
        <button class="secondary-btn" data-action="edit-task" data-id="${task.id}" type="button">Edit</button>
        <button class="danger-btn" data-action="delete-task" data-id="${task.id}" type="button">Delete</button>
      </div>
    </article>
  `;
}

function renderDeadlines() {
  const deadlines = getSortedDeadlines();
  elements.deadlineList.innerHTML = deadlines.length
    ? deadlines
        .map((deadline) => {
          const countdown = getCountdown(deadline.dueDate);
          return `
            <article class="deadline-item ${countdown.status}">
              <div>
                <div class="deadline-item-header">
                  <div>
                    <strong>${escapeHtml(deadline.title)}</strong>
                    <p class="muted-copy">${formatReadableDate(deadline.dueDate)}</p>
                  </div>
                  <span class="tag" style="--tag-color:${getSubjectColor(deadline.subject)};">${escapeHtml(deadline.subject)}</span>
                </div>

                <div class="deadline-actions">
                  <span class="deadline-pill ${countdown.status}">${countdown.label}</span>
                  <button class="secondary-btn" data-action="edit-deadline" data-id="${deadline.id}" type="button">Edit</button>
                  <button class="danger-btn" data-action="delete-deadline" data-id="${deadline.id}" type="button">Delete</button>
                </div>
              </div>

              <div class="countdown">
                <strong>${countdown.primary}</strong>
                <p class="muted-copy">${countdown.secondary}</p>
              </div>
            </article>
          `;
        })
        .join("")
    : createEmptyStateMarkup("No deadlines yet", "Capture exams, projects, and submissions to see live countdowns.");
}

function renderPomodoro() {
  elements.modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.pomodoro.mode);
  });

  elements.pomodoroLabel.textContent = modeLabels[state.pomodoro.mode];
  elements.pomodoroTime.textContent = formatSeconds(state.pomodoro.remainingSeconds);
  elements.pomodoroSessionCount.textContent = state.pomodoro.completedSessions;
  elements.pomodoroTotalHours.textContent = `${(getWeeklyStudyMinutes() / 60).toFixed(1)} hrs`;
  elements.pomodoroHelper.textContent = state.pomodoro.isRunning
    ? "Timer is running. Keep the streak going."
    : "Paused and ready whenever you are.";
  elements.pomodoroNextStep.textContent =
    state.pomodoro.mode === "focus"
      ? state.pomodoro.isRunning
        ? "Stay locked in"
        : "Start your next focus block"
      : state.pomodoro.isRunning
        ? "Recharge intentionally"
        : "Take a recovery break";
}

function renderAttendance() {
  const threshold = Number(state.settings.attendanceThreshold);
  elements.attendanceList.innerHTML = state.attendance.length
    ? state.attendance
        .slice()
        .sort((first, second) => getAttendancePercentage(second) - getAttendancePercentage(first))
        .map((subject) => {
          const percentage = getAttendancePercentage(subject);
          const warningClass = percentage < threshold ? "warning-text" : "";
          return `
            <article class="attendance-card">
              <div class="attendance-card-header">
                <div>
                  <strong>${escapeHtml(subject.subject)}</strong>
                  <div class="attendance-meta">
                    <span class="tag" style="--tag-color:${getSubjectColor(subject.subject)};">${percentage}%</span>
                    <span class="${warningClass}">${subject.attendedClasses}/${subject.totalClasses || 0} classes attended</span>
                  </div>
                </div>
                <span class="${percentage < threshold ? "danger-text" : "muted-copy"}">${percentage < threshold ? "Below threshold" : "On track"}</span>
              </div>

              <div class="progress-bar" style="--progress:${percentage}%;">
                <span></span>
              </div>

              <div class="attendance-actions">
                <button class="ghost-btn" data-action="mark-present" data-id="${subject.id}" type="button">Mark Present</button>
                <button class="ghost-btn" data-action="mark-absent" data-id="${subject.id}" type="button">Mark Absent</button>
                <button class="secondary-btn" data-action="edit-subject" data-id="${subject.id}" type="button">Edit</button>
                <button class="danger-btn" data-action="delete-subject" data-id="${subject.id}" type="button">Delete</button>
              </div>
            </article>
          `;
        })
        .join("")
    : createEmptyStateMarkup("No attendance subjects yet", "Add your classes to track attendance percentage and low-attendance alerts.");

  renderAttendanceCharts();
}

function renderAnalytics() {
  renderStudyChart();
  renderTaskChart();
  renderAttendanceAnalyticsChart();

  elements.analyticsInsights.innerHTML = getAnalyticsInsights()
    .map(
      (insight) => `
        <article class="insight-card">
          <p class="eyebrow">${insight.label}</p>
          <h4>${insight.title}</h4>
          <p class="muted-copy">${insight.copy}</p>
        </article>
      `
    )
    .join("");
}

function renderAttendanceCharts() {
  if (typeof Chart === "undefined") return;

  const labels = state.attendance.map((item) => item.subject);
  const values = state.attendance.map((item) => getAttendancePercentage(item));
  const colors = labels.map((label) => getSubjectColor(label));

  destroyChart("attendanceSection");
  charts.attendanceSection = new Chart(document.getElementById("attendance-chart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Attendance %",
          data: values,
          backgroundColor: colors,
          borderRadius: 12,
          maxBarThickness: 32,
        },
      ],
    },
    options: {
      ...getSharedChartOptions(),
      scales: {
        x: { ticks: { color: getChartTextColor() }, grid: { display: false } },
        y: {
          beginAtZero: true,
          suggestedMax: 100,
          ticks: { color: getChartTextColor() },
          grid: { color: getChartGridColor() },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

function renderStudyChart() {
  if (typeof Chart === "undefined") return;

  const weekData = getLast7DaysData();
  destroyChart("study");
  charts.study = new Chart(document.getElementById("study-chart"), {
    type: "line",
    data: {
      labels: weekData.map((entry) => entry.label),
      datasets: [
        {
          label: "Study minutes",
          data: weekData.map((entry) => entry.minutes),
          borderColor: "#7c9cff",
          backgroundColor: "rgba(124, 156, 255, 0.18)",
          tension: 0.35,
          fill: true,
          pointBackgroundColor: "#4de2c5",
          pointBorderWidth: 0,
          pointRadius: 5,
        },
      ],
    },
    options: {
      ...getSharedChartOptions(),
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: getChartTextColor() }, grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { color: getChartTextColor() },
          grid: { color: getChartGridColor() },
        },
      },
    },
  });
}

function renderTaskChart() {
  if (typeof Chart === "undefined") return;

  const counts = statusOrder.map((status) => state.tasks.filter((task) => task.status === status).length);
  destroyChart("task");
  charts.task = new Chart(document.getElementById("task-chart"), {
    type: "doughnut",
    data: {
      labels: ["To Do", "In Progress", "Completed"],
      datasets: [
        {
          data: counts,
          backgroundColor: ["#7c9cff", "#ffd166", "#4de2c5"],
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      ...getSharedChartOptions(),
      cutout: "72%",
      plugins: {
        legend: {
          labels: { color: getChartTextColor(), padding: 18 },
        },
      },
    },
  });
}

function renderAttendanceAnalyticsChart() {
  if (typeof Chart === "undefined") return;

  const sorted = state.attendance
    .slice()
    .sort((first, second) => getAttendancePercentage(first) - getAttendancePercentage(second));

  destroyChart("attendanceAnalytics");
  charts.attendanceAnalytics = new Chart(document.getElementById("attendance-analytics-chart"), {
    type: "bar",
    data: {
      labels: sorted.map((item) => item.subject),
      datasets: [
        {
          label: "Attendance %",
          data: sorted.map((item) => getAttendancePercentage(item)),
          backgroundColor: sorted.map((item) => getSubjectColor(item.subject)),
          borderRadius: 12,
          maxBarThickness: 28,
        },
      ],
    },
    options: {
      ...getSharedChartOptions(),
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: {
          beginAtZero: true,
          suggestedMax: 100,
          ticks: { color: getChartTextColor() },
          grid: { color: getChartGridColor() },
        },
        y: {
          ticks: { color: getChartTextColor() },
          grid: { display: false },
        },
      },
    },
  });
}

function getSharedChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 650, easing: "easeOutQuart" },
  };
}

function destroyChart(key) {
  if (charts[key]) charts[key].destroy();
}

function handleTaskSubmit(event) {
  event.preventDefault();

  const taskPayload = {
    id: elements.taskId.value || createId(),
    title: elements.taskTitle.value.trim(),
    subject: elements.taskSubject.value.trim(),
    priority: elements.taskPriority.value,
    dueDate: new Date(elements.taskDueDate.value).toISOString(),
    status: elements.taskStatus.value,
    notes: elements.taskNotes.value.trim(),
  };

  const existingIndex = state.tasks.findIndex((task) => task.id === taskPayload.id);
  if (existingIndex >= 0) {
    state.tasks[existingIndex] = taskPayload;
    showToast("Task updated");
  } else {
    state.tasks.push(taskPayload);
    showToast("Task added");
  }

  saveState();
  closeModal("task-modal");
  renderApp();
}

function handleDeadlineSubmit(event) {
  event.preventDefault();

  const deadlinePayload = {
    id: elements.deadlineId.value || createId(),
    title: elements.deadlineTitle.value.trim(),
    subject: elements.deadlineSubject.value.trim(),
    dueDate: new Date(elements.deadlineDueDate.value).toISOString(),
  };

  const existingIndex = state.deadlines.findIndex((deadline) => deadline.id === deadlinePayload.id);
  if (existingIndex >= 0) {
    state.deadlines[existingIndex] = deadlinePayload;
    showToast("Deadline updated");
  } else {
    state.deadlines.push(deadlinePayload);
    showToast("Deadline added");
  }

  saveState();
  closeModal("deadline-modal");
  renderApp();
}

function handleSubjectSubmit(event) {
  event.preventDefault();

  const totalClasses = Number(elements.subjectTotal.value);
  const attendedClasses = Number(elements.subjectAttended.value);

  if (attendedClasses > totalClasses) {
    showToast("Attended classes cannot exceed total classes");
    return;
  }

  const subjectPayload = {
    id: elements.subjectId.value || createId(),
    subject: elements.subjectName.value.trim(),
    totalClasses,
    attendedClasses,
  };

  const existingIndex = state.attendance.findIndex((item) => item.id === subjectPayload.id);
  if (existingIndex >= 0) {
    state.attendance[existingIndex] = subjectPayload;
    showToast("Attendance updated");
  } else {
    state.attendance.push(subjectPayload);
    showToast("Subject added");
  }

  saveState();
  closeModal("subject-modal");
  renderApp();
}

function handleSettingsSubmit(event) {
  event.preventDefault();

  state.settings.focusDuration = Number(elements.focusDuration.value);
  state.settings.shortBreakDuration = Number(elements.shortBreakDuration.value);
  state.settings.longBreakDuration = Number(elements.longBreakDuration.value);
  state.settings.attendanceThreshold = Number(elements.attendanceThreshold.value);

  if (!state.pomodoro.isRunning) {
    state.pomodoro.remainingSeconds = getPomodoroModeDuration(state.pomodoro.mode) * 60;
  }

  saveState();
  renderApp();
  showToast("Settings saved");
}

function openTaskModal(taskId = null) {
  const task = state.tasks.find((item) => item.id === taskId);
  elements.taskModalTitle.textContent = task ? "Edit Task" : "Add Task";
  elements.taskId.value = task?.id || "";
  elements.taskTitle.value = task?.title || "";
  elements.taskSubject.value = task?.subject || "";
  elements.taskPriority.value = task?.priority || "high";
  elements.taskDueDate.value = task ? toDateTimeLocalValue(task.dueDate) : toDateTimeLocalValue(getFutureDate(1));
  elements.taskStatus.value = task?.status || "todo";
  elements.taskNotes.value = task?.notes || "";
  openModal("task-modal");
}

function openDeadlineModal(deadlineId = null) {
  const deadline = state.deadlines.find((item) => item.id === deadlineId);
  elements.deadlineModalTitle.textContent = deadline ? "Edit Deadline" : "Add Deadline";
  elements.deadlineId.value = deadline?.id || "";
  elements.deadlineTitle.value = deadline?.title || "";
  elements.deadlineSubject.value = deadline?.subject || "";
  elements.deadlineDueDate.value = deadline ? toDateTimeLocalValue(deadline.dueDate) : toDateTimeLocalValue(getFutureDate(2));
  openModal("deadline-modal");
}

function openSubjectModal(subjectId = null) {
  const subject = state.attendance.find((item) => item.id === subjectId);
  elements.subjectModalTitle.textContent = subject ? "Edit Subject" : "Add Subject";
  elements.subjectId.value = subject?.id || "";
  elements.subjectName.value = subject?.subject || "";
  elements.subjectTotal.value = subject?.totalClasses || 0;
  elements.subjectAttended.value = subject?.attendedClasses || 0;
  openModal("subject-modal");
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  saveState();
  renderApp();
  showToast("Task deleted");
}

function updateTaskStatus(taskId, status) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;
  task.status = status;
  saveState();
  renderApp();
  showToast(`Moved to ${statusLabels[status]}`);
}

function deleteDeadline(deadlineId) {
  state.deadlines = state.deadlines.filter((deadline) => deadline.id !== deadlineId);
  saveState();
  renderApp();
  showToast("Deadline deleted");
}

function updateAttendance(subjectId, present) {
  const subject = state.attendance.find((item) => item.id === subjectId);
  if (!subject) return;

  subject.totalClasses += 1;
  if (present) subject.attendedClasses += 1;

  saveState();
  renderApp();
  showToast(present ? "Attendance marked present" : "Attendance marked absent");
}

function deleteSubject(subjectId) {
  state.attendance = state.attendance.filter((item) => item.id !== subjectId);
  saveState();
  renderApp();
  showToast("Subject removed");
}

function startPomodoro() {
  if (state.pomodoro.isRunning) return;
  state.pomodoro.isRunning = true;
  state.pomodoro.lastTickAt = Date.now();
  saveState();
  renderPomodoro();
  showToast("Pomodoro started");
}

function pausePomodoro() {
  if (!state.pomodoro.isRunning) return;
  state.pomodoro.isRunning = false;
  state.pomodoro.lastTickAt = null;
  saveState();
  renderPomodoro();
  showToast("Pomodoro paused");
}

function resetPomodoro() {
  state.pomodoro.isRunning = false;
  state.pomodoro.lastTickAt = null;
  state.pomodoro.remainingSeconds = getPomodoroModeDuration(state.pomodoro.mode) * 60;
  saveState();
  renderPomodoro();
  showToast("Timer reset");
}

function setPomodoroMode(mode, shouldToast = false) {
  state.pomodoro.mode = mode;
  state.pomodoro.isRunning = false;
  state.pomodoro.lastTickAt = null;
  state.pomodoro.remainingSeconds = getPomodoroModeDuration(mode) * 60;
  saveState();
  renderPomodoro();
  if (shouldToast) showToast(`${modeLabels[mode]} ready`);
}

function getPomodoroModeDuration(mode) {
  if (mode === "shortBreak") return state.settings.shortBreakDuration;
  if (mode === "longBreak") return state.settings.longBreakDuration;
  return state.settings.focusDuration;
}

function reconcilePomodoroOnLoad() {
  if (!state.pomodoro.isRunning || !state.pomodoro.lastTickAt) return;

  const elapsedSeconds = Math.floor((Date.now() - state.pomodoro.lastTickAt) / 1000);
  if (elapsedSeconds <= 0) return;

  state.pomodoro.remainingSeconds = Math.max(0, state.pomodoro.remainingSeconds - elapsedSeconds);

  if (state.pomodoro.remainingSeconds === 0) {
    completePomodoroCycle();
  } else {
    state.pomodoro.lastTickAt = Date.now();
    saveState();
  }
}

function completePomodoroCycle() {
  const completedMode = state.pomodoro.mode;
  state.pomodoro.isRunning = false;
  state.pomodoro.lastTickAt = null;

  if (completedMode === "focus") {
    const completedMinutes = state.settings.focusDuration;
    state.pomodoro.completedSessions += 1;
    state.pomodoro.totalFocusMinutes += completedMinutes;
    addStudyMinutes(completedMinutes);
    const nextMode = state.pomodoro.completedSessions % 4 === 0 ? "longBreak" : "shortBreak";
    state.pomodoro.mode = nextMode;
    state.pomodoro.remainingSeconds = getPomodoroModeDuration(nextMode) * 60;
    showToast("Focus session completed");
  } else {
    state.pomodoro.mode = "focus";
    state.pomodoro.remainingSeconds = getPomodoroModeDuration("focus") * 60;
    showToast("Break complete. Ready for the next session.");
  }

  saveState();
  renderApp();
}

function addStudyMinutes(minutes) {
  const todayKey = formatDateKey(new Date());
  const existing = state.studyLog.find((item) => item.date === todayKey);

  if (existing) {
    existing.minutes += minutes;
  } else {
    state.studyLog.push({ date: todayKey, minutes });
  }

  state.studyLog = getLast7DaysData().map((entry) => ({
    date: entry.key,
    minutes: entry.minutes,
  }));
}

function startHeartbeat() {
  updateDateTime();
  clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    updateDateTime();
    tickPomodoro();
    renderDeadlines();
    if (state.ui.activeSection === "overview") renderOverview();
  }, 1000);
}

function tickPomodoro() {
  if (!state.pomodoro.isRunning) return;

  const now = Date.now();
  const elapsedSeconds = Math.floor((now - state.pomodoro.lastTickAt) / 1000);
  if (elapsedSeconds < 1) return;

  state.pomodoro.remainingSeconds = Math.max(0, state.pomodoro.remainingSeconds - elapsedSeconds);
  state.pomodoro.lastTickAt = now;

  if (state.pomodoro.remainingSeconds === 0) {
    completePomodoroCycle();
    return;
  }

  saveState();
  renderPomodoro();
}

function updateDateTime() {
  const now = new Date();
  elements.currentDate.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  elements.currentTime.textContent = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme();
  saveState();
  renderAnalytics();
  renderAttendanceCharts();
}

function applyTheme() {
  elements.body.dataset.theme = state.theme;
  elements.themeLabel.textContent = state.theme === "dark" ? "Dark mode" : "Light mode";
}

function syncSettingsForm() {
  elements.focusDuration.value = state.settings.focusDuration;
  elements.shortBreakDuration.value = state.settings.shortBreakDuration;
  elements.longBreakDuration.value = state.settings.longBreakDuration;
  elements.attendanceThreshold.value = state.settings.attendanceThreshold;
}

function clearAllData() {
  const confirmed = window.confirm("Clear all saved dashboard data? This cannot be undone.");
  if (!confirmed) return;

  const theme = state.theme;
  state = createEmptyState(theme);
  saveState();
  syncSettingsForm();
  renderApp();
  showToast("All dashboard data cleared");
}

function getTodayFocusMessage() {
  const urgentTask = state.tasks
    .filter((task) => task.status !== "completed")
    .sort((first, second) => new Date(first.dueDate) - new Date(second.dueDate))[0];

  const urgentDeadline = getSortedDeadlines()[0];
  const pendingCount = state.tasks.filter((task) => task.status !== "completed").length;

  if (urgentTask) {
    return {
      title: `Prioritize ${urgentTask.title}`,
      copy: `${pendingCount} active tasks left. ${urgentTask.subject} is your nearest unfinished task, so knocking out one focused block there will create the biggest win today.`,
    };
  }

  if (urgentDeadline) {
    return {
      title: `Keep an eye on ${urgentDeadline.title}`,
      copy: `Your task list is clear. Use today to prep for ${urgentDeadline.subject} and stay ahead of the upcoming deadline.`,
    };
  }

  return {
    title: "Stay on top of your priorities.",
    copy: "You have a clean slate right now. Add tasks, deadlines, or attendance subjects to turn this dashboard into your daily command center.",
  };
}

function getAnalyticsInsights() {
  const weekData = getLast7DaysData();
  const fallbackDay = weekData[0] || { label: "No data", minutes: 0 };
  const mostProductive = weekData.reduce(
    (best, current) => (current.minutes > best.minutes ? current : best),
    fallbackDay
  );
  const pendingTasks = state.tasks.filter((task) => task.status !== "completed").length;
  const urgentDeadlines = getSortedDeadlines()
    .filter((deadline) => getCountdown(deadline.dueDate).status !== "overdue")
    .slice(0, 2);
  const lowAttendanceSubjects = state.attendance.filter(
    (subject) => getAttendancePercentage(subject) < state.settings.attendanceThreshold
  );

  return [
    {
      label: "Most Productive Day",
      title: mostProductive.minutes ? `${mostProductive.label} led with ${mostProductive.minutes} mins` : "Start logging study time",
      copy: mostProductive.minutes
        ? "Use that day’s routine as your template for the rest of the week."
        : "Complete a few Pomodoro sessions to unlock weekly study insights.",
    },
    {
      label: "Pending Workload",
      title: `${pendingTasks} tasks still open`,
      copy: urgentDeadlines.length
        ? `Nearest deadlines: ${urgentDeadlines.map((item) => item.title).join(", ")}.`
        : "You have breathing room on deadlines right now.",
    },
    {
      label: "Attendance Watch",
      title: lowAttendanceSubjects.length
        ? lowAttendanceSubjects.map((item) => item.subject).join(", ")
        : "All tracked subjects are healthy",
      copy: lowAttendanceSubjects.length
        ? `These subjects are below your ${state.settings.attendanceThreshold}% threshold and need attention.`
        : "Keep the momentum going by marking each class consistently.",
    },
  ];
}

function getSortedDeadlines() {
  return state.deadlines.slice().sort((first, second) => new Date(first.dueDate) - new Date(second.dueDate));
}

function getCountdown(dateString) {
  const now = new Date();
  const target = new Date(dateString);
  const diffMs = target - now;
  const absoluteMs = Math.abs(diffMs);
  const totalHours = Math.floor(absoluteMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (diffMs < 0) {
    return {
      status: "overdue",
      label: "Overdue",
      primary: `${days}d ${hours}h`,
      secondary: "Past due",
    };
  }

  if (totalHours <= 48) {
    return {
      status: "urgent",
      label: "Urgent",
      primary: `${days}d ${hours}h`,
      secondary: "Remaining",
    };
  }

  return {
    status: "normal",
    label: "Upcoming",
    primary: `${days}d ${hours}h`,
    secondary: "Remaining",
  };
}

function getOverallAttendance() {
  const totalClasses = state.attendance.reduce((sum, item) => sum + Number(item.totalClasses || 0), 0);
  const attendedClasses = state.attendance.reduce((sum, item) => sum + Number(item.attendedClasses || 0), 0);
  if (!totalClasses) return 0;
  return Math.round((attendedClasses / totalClasses) * 100);
}

function getAttendancePercentage(subject) {
  if (!subject.totalClasses) return 0;
  return Math.round((subject.attendedClasses / subject.totalClasses) * 100);
}

function getWeeklyStudyMinutes() {
  return getLast7DaysData().reduce((sum, item) => sum + item.minutes, 0);
}

function getLast7DaysData() {
  const lookup = new Map(state.studyLog.map((entry) => [entry.date, Number(entry.minutes || 0)]));
  const data = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = formatDateKey(date);
    data.push({
      key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      minutes: lookup.get(key) || 0,
    });
  }

  return data;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatReadableDate(dateString) {
  return new Date(dateString).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSeconds(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function toDateTimeLocalValue(dateInput) {
  const date = new Date(dateInput);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function getFutureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(date.getHours() + 4, 0, 0, 0);
  return date;
}

function createEmptyStateMarkup(title, description) {
  return `
    <div class="empty-state">
      <strong>${title}</strong>
      <p class="muted-copy">${description}</p>
    </div>
  `;
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  elements.toastStack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 240);
  }, 2600);
}

function getSubjectColor(subject) {
  const palette = ["#7c9cff", "#4de2c5", "#ffb86b", "#ff8fab", "#6fd4ff", "#9f8cff", "#78e08f"];
  const sum = subject.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return palette[sum % palette.length];
}

function getChartTextColor() {
  return state.theme === "dark" ? "#adc1dc" : "#4b607c";
}

function getChartGridColor() {
  return state.theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(23,35,55,0.08)";
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
