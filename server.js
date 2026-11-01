const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "tasks.json");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const today = new Date();
    const plusDays = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    };
    const starterTasks = [
      {
        id: crypto.randomUUID(),
        title: "Check passport expiry date",
        category: "Documents",
        dueDate: plusDays(12),
        priority: "High",
        status: "Pending",
        notes: "Check the expiry date and make a renewal plan if needed.",
        dependsOn: "",
        reminderDate: plusDays(9),
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Prepare application documents",
        category: "Education",
        dueDate: plusDays(5),
        priority: "Medium",
        status: "In Progress",
        notes: "Keep transcripts, CV, and certificates together.",
        dependsOn: "",
        reminderDate: plusDays(3),
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Book English test slot",
        category: "Education",
        dueDate: plusDays(18),
        priority: "High",
        status: "Pending",
        notes: "Compare available dates before booking.",
        dependsOn: "",
        reminderDate: plusDays(14),
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Review monthly subscriptions",
        category: "Finance",
        dueDate: plusDays(2),
        priority: "Low",
        status: "Completed",
        notes: "Cancel anything you no longer use.",
        dependsOn: "",
        reminderDate: "",
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(starterTasks, null, 2));
  }
}

function readTasks() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

function cleanTask(body, existing = {}) {
  const title = String(body.title ?? existing.title ?? "").trim();
  if (!title) return { error: "Please enter a task title." };
  if (title.length > 120) return { error: "Task title must be 120 characters or fewer." };

  const categories = ["Personal", "Documents", "Education", "Finance", "Work", "Health", "Other"];
  const priorities = ["Low", "Medium", "High"];
  const statuses = ["Pending", "In Progress", "Completed"];
  const category = categories.includes(body.category ?? existing.category) ? (body.category ?? existing.category) : "Personal";
  const priority = priorities.includes(body.priority ?? existing.priority) ? (body.priority ?? existing.priority) : "Medium";
  const status = statuses.includes(body.status ?? existing.status) ? (body.status ?? existing.status) : "Pending";
  const dueDate = String(body.dueDate ?? existing.dueDate ?? "");
  const reminderDate = String(body.reminderDate ?? existing.reminderDate ?? "");
  const notes = String(body.notes ?? existing.notes ?? "").trim().slice(0, 2000);
  const dependsOn = String(body.dependsOn ?? existing.dependsOn ?? "");

  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return { error: "Please use a valid due date." };
  if (reminderDate && !/^\d{4}-\d{2}-\d{2}$/.test(reminderDate)) return { error: "Please use a valid reminder date." };

  return { value: { title, category, priority, status, dueDate, reminderDate, notes, dependsOn } };
}

app.get("/api/tasks", (_req, res) => {
  const tasks = readTasks().sort((a, b) => {
    if (a.status === "Completed" && b.status !== "Completed") return 1;
    if (b.status === "Completed" && a.status !== "Completed") return -1;
    return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
  });
  res.json(tasks);
});

app.post("/api/tasks", (req, res) => {
  const result = cleanTask(req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  const tasks = readTasks();
  const { value } = result;
  if (value.dependsOn && !tasks.some(t => t.id === value.dependsOn)) {
    return res.status(400).json({ error: "The selected prerequisite task no longer exists." });
  }
  const task = { id: crypto.randomUUID(), ...value, createdAt: new Date().toISOString() };
  tasks.push(task);
  writeTasks(tasks);
  res.status(201).json(task);
});

app.put("/api/tasks/:id", (req, res) => {
  const tasks = readTasks();
  const index = tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Task not found." });
  const result = cleanTask(req.body, tasks[index]);
  if (result.error) return res.status(400).json({ error: result.error });
  const { value } = result;
  if (value.dependsOn === req.params.id) return res.status(400).json({ error: "A task cannot depend on itself." });
  if (value.dependsOn && !tasks.some(t => t.id === value.dependsOn)) {
    return res.status(400).json({ error: "The selected prerequisite task no longer exists." });
  }
  tasks[index] = { ...tasks[index], ...value, updatedAt: new Date().toISOString() };
  writeTasks(tasks);
  res.json(tasks[index]);
});

app.delete("/api/tasks/:id", (req, res) => {
  const tasks = readTasks();
  if (!tasks.some(t => t.id === req.params.id)) return res.status(404).json({ error: "Task not found." });
  const remaining = tasks
    .filter(t => t.id !== req.params.id)
    .map(t => t.dependsOn === req.params.id ? { ...t, dependsOn: "" } : t);
  writeTasks(remaining);
  res.json({ success: true });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

ensureStore();
app.listen(PORT, () => {
  console.log(`LifeAdmin is running at http://localhost:${PORT}`);
});
