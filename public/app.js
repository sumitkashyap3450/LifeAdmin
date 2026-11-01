const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let tasks = [];
let currentView = "all";
let currentCategory = "";
let editingId = "";
let toastTimer;

const todayISO = () => {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const dateObj = (value) => value ? new Date(`${value}T00:00:00`) : null;
const formatDate = (value) => {
  if (!value) return "No due date";
  const d = dateObj(value);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));
const isOverdue = (task) => task.status !== "Completed" && task.dueDate && task.dueDate < todayISO();
const isDueToday = (task) => task.status !== "Completed" && task.dueDate === todayISO();
const isUpcoming = (task) => task.status !== "Completed" && task.dueDate && task.dueDate > todayISO();
const isReminderDue = (task) => task.status !== "Completed" && task.reminderDate && task.reminderDate <= todayISO();

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Something went wrong. Please try again.");
  return data;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function setupDateAndGreeting() {
  const now = new Date();
  $("#todayLabel").textContent = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning." : hour < 17 ? "Good afternoon." : "Good evening.";
  $("#greeting").innerHTML = `${greeting} A little more <em>in order.</em>`;
}

function updateStats() {
  const open = tasks.filter(t => t.status !== "Completed");
  const completed = tasks.filter(t => t.status === "Completed");
  const dueToday = open.filter(isDueToday);
  const overdue = open.filter(isOverdue);
  const rate = tasks.length ? Math.round(completed.length / tasks.length * 100) : 0;
  $("#openCount").textContent = open.length;
  $("#dueTodayCount").textContent = dueToday.length;
  $("#completedCount").textContent = completed.length;
  $("#overdueCount").textContent = overdue.length;
  $("#navAllCount").textContent = open.length;
  $("#completionRate").textContent = `${rate}%`;
  $("#progressFill").style.width = `${rate}%`;
  $("#openCaption").textContent = open.length ? `${open.length} thing${open.length === 1 ? "" : "s"} on your plate` : "All clear for now";
  $("#completionCaption").textContent = tasks.length ? `${completed.length} of ${tasks.length} tasks finished` : "Every step counts";
  $("#progressMessage").textContent = rate === 100 && tasks.length ? "Look at you go — everything is done!" : rate >= 50 ? "You're building great momentum. Keep going." : "Every task you finish is progress.";
  $("#notificationDot").style.display = tasks.some(isReminderDue) ? "block" : "none";
}

function viewTitle() {
  if (currentCategory) return currentCategory;
  return ({ all: "Overview", today: "Due today", upcoming: "Upcoming", completed: "Completed" })[currentView] || "Overview";
}

function setActiveNavigation() {
  $$(".nav-item").forEach(button => {
    const viewMatch = button.dataset.view && button.dataset.view === currentView && !currentCategory;
    const categoryMatch = button.dataset.category && button.dataset.category === currentCategory;
    button.classList.toggle("active", Boolean(viewMatch || categoryMatch));
  });
  $("#breadcrumbCurrent").textContent = viewTitle();
  $("#listHeading").innerHTML = `${currentCategory ? escapeHTML(currentCategory) : ({ all: "Your tasks", today: "Due today", upcoming: "Coming up", completed: "Completed tasks" })[currentView] || "Your tasks"} <span id="listCount" class="heading-count">${visibleTasks().length}</span>`;
}

function visibleTasks() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const status = $("#statusFilter").value;
  const priority = $("#priorityFilter").value;
  const category = $("#categoryFilter").value;
  let list = tasks.filter(task => {
    if (currentCategory && task.category !== currentCategory) return false;
    if (!currentCategory) {
      if (currentView === "today" && !isDueToday(task)) return false;
      if (currentView === "upcoming" && !isUpcoming(task)) return false;
      if (currentView === "completed" && task.status !== "Completed") return false;
    }
    if (status !== "all" && task.status !== status) return false;
    if (priority !== "all" && task.priority !== priority) return false;
    if (category !== "all" && task.category !== category) return false;
    if (query && ![task.title, task.notes, task.category, task.status, task.priority].join(" ").toLowerCase().includes(query)) return false;
    return true;
  });

  const sort = $("#sortSelect").value;
  list.sort((a, b) => {
    if (sort === "created") return (b.createdAt || "").localeCompare(a.createdAt || "");
    if (sort === "priority") return ({ High: 0, Medium: 1, Low: 2 }[a.priority] - { High: 0, Medium: 1, Low: 2 }[b.priority]);
    if (sort === "title") return a.title.localeCompare(b.title);
    if (a.status === "Completed" && b.status !== "Completed") return 1;
    if (b.status === "Completed" && a.status !== "Completed") return -1;
    return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
  });
  return list;
}

function dueLabel(task) {
  if (!task.dueDate) return "No due date";
  if (task.status === "Completed") return `Due ${formatDate(task.dueDate)}`;
  if (isOverdue(task)) return `Overdue · ${formatDate(task.dueDate)}`;
  if (isDueToday(task)) return "Due today";
  if (task.dueDate === tomorrowISO()) return "Due tomorrow";
  return `Due ${formatDate(task.dueDate)}`;
}
function tomorrowISO() {
  const d = dateObj(todayISO());
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
function taskCard(task) {
  const completed = task.status === "Completed";
  const dependency = tasks.find(t => t.id === task.dependsOn);
  const dateClass = isOverdue(task) ? "overdue" : (isDueToday(task) || task.dueDate === tomorrowISO()) ? "due-soon" : "";
  return `<article class="task-row ${completed ? "is-completed" : ""}" data-id="${escapeHTML(task.id)}">
    <button class="task-check ${completed ? "checked" : ""}" data-action="toggle" aria-label="${completed ? "Mark incomplete" : "Mark complete"}">${completed ? "✓" : ""}</button>
    <div class="task-main">
      <div class="task-title-line"><span class="task-title">${escapeHTML(task.title)}</span></div>
      ${task.notes ? `<p class="task-note">${escapeHTML(task.notes)}</p>` : ""}
      <div class="task-meta">
        <span class="pill category-pill">${escapeHTML(task.category)}</span>
        <span class="pill priority-${task.priority.toLowerCase()}">${escapeHTML(task.priority)} priority</span>
        <span class="pill status-pill ${task.status.toLowerCase().replace(" ", "-")}">${escapeHTML(task.status)}</span>
        <span class="task-date ${dateClass}">◷ ${escapeHTML(dueLabel(task))}</span>
        ${dependency ? `<span class="dependency-tag">↳ Depends on: ${escapeHTML(dependency.title)}</span>` : ""}
      </div>
    </div>
    <div class="task-actions">
      <button class="task-action" data-action="edit" aria-label="Edit ${escapeHTML(task.title)}" title="Edit task">✎</button>
      <button class="task-action delete" data-action="delete" aria-label="Delete ${escapeHTML(task.title)}" title="Delete task">⌫</button>
    </div>
  </article>`;
}

function renderTasks() {
  setActiveNavigation();
  const list = visibleTasks();
  $("#listCount").textContent = list.length;
  const listEl = $("#taskList");
  if (!list.length) {
    const hasFilters = $("#searchInput").value || currentCategory || currentView !== "all" || $("#statusFilter").value !== "all" || $("#priorityFilter").value !== "all" || $("#categoryFilter").value !== "all";
    listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">${hasFilters ? "⌕" : "✦"}</div><h3>${hasFilters ? "No tasks found" : "A fresh start"}</h3><p>${hasFilters ? "Try changing your search or filters." : "Add your first task and give your plans a home."}</p>${hasFilters ? '<button class="secondary-button" id="emptyClearFilters">Clear filters</button>' : '<button class="primary-button" id="emptyAddTask">＋ Create your first task</button>'}</div>`;
    $("#listFooterText").textContent = hasFilters ? "Nothing matches these filters." : "Your plans, all in one place.";
  } else {
    listEl.innerHTML = list.map(taskCard).join("");
    $("#listFooterText").textContent = `Showing ${list.length} task${list.length === 1 ? "" : "s"} · Changes are saved automatically`;
  }
  $("#showAllButton").hidden = currentView === "all" && !currentCategory;
  $("#filterCount").hidden = activeFilterCount() === 0;
  $("#filterCount").textContent = activeFilterCount();
  updateStats();
}

function activeFilterCount() {
  return [$("#statusFilter").value !== "all", $("#priorityFilter").value !== "all", $("#categoryFilter").value !== "all"].filter(Boolean).length;
}

async function loadTasks() {
  try {
    tasks = await api("/api/tasks");
    renderTasks();
  } catch (error) {
    $("#taskList").innerHTML = `<div class="empty-state"><div class="empty-icon">!</div><h3>Couldn't load your tasks</h3><p>${escapeHTML(error.message)} Check that the Node server is running.</p></div>`;
  }
}

function openModal(task = null) {
  editingId = task?.id || "";
  $("#taskForm").reset();
  $("#taskId").value = editingId;
  $("#modalTitle").textContent = task ? "Edit task" : "Create a task";
  $("#saveTaskButton").innerHTML = task ? "Save changes <span>→</span>" : "Save task <span>→</span>";
  $("#taskTitle").value = task?.title || "";
  $("#taskCategory").value = task?.category || "Personal";
  $("#taskPriority").value = task?.priority || "Medium";
  $("#taskDueDate").value = task?.dueDate || "";
  $("#taskReminderDate").value = task?.reminderDate || "";
  $("#taskStatus").value = task?.status || "Pending";
  $("#taskNotes").value = task?.notes || "";
  $("#formError").textContent = "";
  populateDependencies(task?.id || "", task?.dependsOn || "");
  $("#taskModal").hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => $("#taskTitle").focus(), 60);
}
function closeModal() {
  $("#taskModal").hidden = true;
  document.body.style.overflow = "";
  editingId = "";
}
function populateDependencies(editId = "", selected = "") {
  const eligible = tasks.filter(t => t.id !== editId && t.status !== "Completed");
  $("#taskDependsOn").innerHTML = '<option value="">No prerequisite</option>' + eligible.map(t => `<option value="${escapeHTML(t.id)}">${escapeHTML(t.title)}</option>`).join("");
  $("#taskDependsOn").value = selected;
  $("#dependencyHint").textContent = eligible.length ? "Choose a prerequisite if this task should wait for another task." : "You can link this task to another open task later.";
}

async function saveTask(event) {
  event.preventDefault();
  const payload = {
    title: $("#taskTitle").value.trim(),
    category: $("#taskCategory").value,
    priority: $("#taskPriority").value,
    dueDate: $("#taskDueDate").value,
    reminderDate: $("#taskReminderDate").value,
    status: $("#taskStatus").value,
    notes: $("#taskNotes").value.trim(),
    dependsOn: $("#taskDependsOn").value
  };
  $("#formError").textContent = "";
  const button = $("#saveTaskButton");
  button.disabled = true;
  button.style.opacity = ".7";
  try {
    const task = editingId
      ? await api(`/api/tasks/${encodeURIComponent(editingId)}`, { method: "PUT", body: JSON.stringify(payload) })
      : await api("/api/tasks", { method: "POST", body: JSON.stringify(payload) });
    if (editingId) tasks = tasks.map(t => t.id === task.id ? task : t);
    else tasks.push(task);
    closeModal();
    renderTasks();
    showToast(editingId ? "Task updated successfully." : "Task created. One step closer!");
  } catch (error) {
    $("#formError").textContent = error.message;
  } finally {
    button.disabled = false;
    button.style.opacity = "1";
  }
}

async function handleTaskAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const row = button.closest(".task-row");
  if (!row) return;
  const task = tasks.find(t => t.id === row.dataset.id);
  if (!task) return;
  const action = button.dataset.action;
  if (action === "edit") return openModal(task);
  if (action === "toggle") {
    const status = task.status === "Completed" ? "Pending" : "Completed";
    try {
      const updated = await api(`/api/tasks/${encodeURIComponent(task.id)}`, { method: "PUT", body: JSON.stringify({ ...task, status }) });
      tasks = tasks.map(t => t.id === updated.id ? updated : t);
      renderTasks();
      showToast(status === "Completed" ? "Nice work — task completed!" : "Task moved back to pending.");
    } catch (error) { showToast(error.message); }
  }
  if (action === "delete") {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try {
      await api(`/api/tasks/${encodeURIComponent(task.id)}`, { method: "DELETE" });
      tasks = tasks.filter(t => t.id !== task.id).map(t => t.dependsOn === task.id ? { ...t, dependsOn: "" } : t);
      renderTasks();
      showToast("Task deleted.");
    } catch (error) { showToast(error.message); }
  }
}

function showReminders() {
  const reminders = tasks.filter(isReminderDue).sort((a, b) => (a.reminderDate || "").localeCompare(b.reminderDate || ""));
  $("#reminderList").innerHTML = reminders.length ? reminders.map(t => `<div class="reminder-item"><strong>${escapeHTML(t.title)}</strong><span>${t.reminderDate < todayISO() ? `Reminder was set for ${formatDate(t.reminderDate)}` : "Reminder set for today"}${t.dueDate ? ` · Due ${formatDate(t.dueDate)}` : ""}</span></div>`).join("") : '<div class="no-reminders">You’re all caught up. No reminders due today.</div>';
  $("#reminderPopover").hidden = false;
}
function clearFilters() {
  $("#statusFilter").value = "all";
  $("#priorityFilter").value = "all";
  $("#categoryFilter").value = "all";
  $("#searchInput").value = "";
  renderTasks();
}

function bindEvents() {
  $("#addTaskTop").addEventListener("click", () => openModal());
  $("#addTaskMain").addEventListener("click", () => openModal());
  $("#closeModal").addEventListener("click", closeModal);
  $("#cancelModal").addEventListener("click", closeModal);
  $("#taskModal").addEventListener("click", e => { if (e.target === $("#taskModal")) closeModal(); });
  $("#taskForm").addEventListener("submit", saveTask);
  $("#taskList").addEventListener("click", async e => {
    if (e.target.id === "emptyAddTask") return openModal();
    if (e.target.id === "emptyClearFilters") { clearFilters(); return; }
    await handleTaskAction(e);
  });
  $("#searchInput").addEventListener("input", renderTasks);
  $("#sortSelect").addEventListener("change", renderTasks);
  ["statusFilter", "priorityFilter", "categoryFilter"].forEach(id => $(`#${id}`).addEventListener("change", renderTasks));
  $("#filterButton").addEventListener("click", () => { $("#filterPanel").hidden = !$("#filterPanel").hidden; });
  $("#clearFilters").addEventListener("click", clearFilters);
  $("#showAllButton").addEventListener("click", () => { currentView = "all"; currentCategory = ""; renderTasks(); });
  $$(".nav-item[data-view]").forEach(button => button.addEventListener("click", () => {
    currentView = button.dataset.view; currentCategory = ""; $("#sidebar").classList.remove("open"); renderTasks();
  }));
  $$(".nav-item[data-category]").forEach(button => button.addEventListener("click", () => {
    currentCategory = button.dataset.category; currentView = "all"; $("#sidebar").classList.remove("open"); renderTasks();
  }));
  $("#reminderButton").addEventListener("click", () => $("#reminderPopover").hidden ? showReminders() : $("#reminderPopover").hidden = true);
  $("#closeReminder").addEventListener("click", () => $("#reminderPopover").hidden = true);
  $("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); $("#searchInput").focus(); }
    if (e.key === "Escape") { closeModal(); $("#reminderPopover").hidden = true; $("#sidebar").classList.remove("open"); }
  });
}

setupDateAndGreeting();
bindEvents();
loadTasks();
