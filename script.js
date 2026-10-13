const taskForm = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const priorityInput = document.querySelector("#priorityInput");
const dateInput = document.querySelector("#dateInput");
const searchInput = document.querySelector("#searchInput");
const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const filterButtons = document.querySelectorAll(".filter-btn");

const totalTasks = document.querySelector("#totalTasks");
const completedTasks = document.querySelector("#completedTasks");
const pendingTasks = document.querySelector("#pendingTasks");

let tasks = JSON.parse(localStorage.getItem("taskflow-tasks")) || [];
let currentFilter = "all";
let searchText = "";

function saveTasks() {
  localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
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

function updateStats() {
  const completed = tasks.filter((task) => task.completed).length;

  totalTasks.textContent = tasks.length;
  completedTasks.textContent = completed;
  pendingTasks.textContent = tasks.length - completed;
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();

  taskList.innerHTML = "";
  emptyState.classList.toggle("hidden", filteredTasks.length > 0);

  filteredTasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = `task-item ${task.completed ? "completed" : ""}`;

    item.innerHTML = `
      <input class="checkbox" type="checkbox" ${task.completed ? "checked" : ""} />
      <div>
        <p class="task-title">${task.title}</p>
        <div class="task-meta">
          <span class="badge ${task.priority}">${task.priority}</span>
          <span>${formatDate(task.dueDate)}</span>
        </div>
      </div>
      <button class="delete-btn" aria-label="Delete task">x</button>
    `;

    item.querySelector(".checkbox").addEventListener("change", () => {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    });

    item.querySelector(".delete-btn").addEventListener("click", () => {
      tasks = tasks.filter((currentTask) => currentTask.id !== task.id);
      saveTasks();
      renderTasks();
    });

    taskList.appendChild(item);
  });

  updateStats();
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
    completed: false
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

renderTasks();