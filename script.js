const taskForm = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const priorityInput = document.querySelector("#priorityInput");
const dateInput = document.querySelector("#dateInput");
const searchInput = document.querySelector("#searchInput");
const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const filterButtons = document.querySelectorAll(".filter-btn");

const paperColors = ["paper-yellow", "paper-pink", "paper-blue", "paper-green", "paper-orange"];
const paperStyles = ["tape", "clip", "pin", "torn"];
const rotations = ["-2deg", "1.5deg", "-1deg", "2deg", "0.5deg"];

let tasks = [];

function getTaskStorageKey() {
  if (!currentUser) return null;
  return `sticky-tasks-${currentUser.email}`;
}

function loadTasks() {
  const key = getTaskStorageKey();
  tasks = key ? JSON.parse(localStorage.getItem(key)) || [] : [];
}
let currentFilter = "all";
let searchText = "";

function saveTasks() {
  const key = getTaskStorageKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(tasks));
}

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function formatDate(date) {
  if (!date) return "No due date";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getFilteredTasks() {
  return tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchText.toLowerCase());

    const matchesFilter =
      currentFilter === "all" ||
      (currentFilter === "completed" && task.completed) ||
      (currentFilter === "pending" && !task.completed);

    return matchesSearch && matchesFilter;
  });
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();

  taskList.innerHTML = "";
  emptyState.classList.toggle("hidden", filteredTasks.length > 0);

  filteredTasks.forEach((task) => {
    const note = document.createElement("article");

    note.className = `sticky-note ${task.color} ${task.style} ${task.completed ? "completed" : ""}`;
    note.style.setProperty("--rotate", task.rotate);

    note.innerHTML = `
      <h2 class="note-title">${task.title}</h2>

      <div class="note-meta">
        <span class="badge ${task.priority}">${task.priority}</span>
        <span class="badge">${formatDate(task.dueDate)}</span>
      </div>

      <div class="note-actions">
        <button class="done-btn">${task.completed ? "Undo" : "Done"}</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    note.querySelector(".done-btn").addEventListener("click", () => {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    });

 note.querySelector(".delete-btn").addEventListener("click", () => {
  note.classList.add("falling");

  setTimeout(() => {
    tasks = tasks.filter((currentTask) => currentTask.id !== task.id);
    saveTasks();
    renderTasks();
  }, 850);
});

    taskList.appendChild(note);
  });
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = taskInput.value.trim();
  if (!title) return;

  tasks.unshift({
    id: Date.now(),
    title,
    priority: priorityInput.value,
    dueDate: dateInput.value,
    completed: false,
    color: getRandomItem(paperColors),
    style: getRandomItem(paperStyles),
    rotate: getRandomItem(rotations)
  });

  saveTasks();
  taskForm.reset();
  priorityInput.value = "medium";
  renderTasks();
});

searchInput.addEventListener("input", (event) => {
  searchText = event.target.value;
  renderTasks();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    currentFilter = button.dataset.filter;
    renderTasks();
  });
});

loadTasks();
renderTasks();