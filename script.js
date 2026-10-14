const taskForm = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const priorityInput = document.querySelector("#priorityInput");
const dateInput = document.querySelector("#dateInput");
const searchInput = document.querySelector("#searchInput");
const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const filterButtons = document.querySelectorAll(".filter-btn");

const paperColors = [
  "paper-yellow", "paper-pink", "paper-blue",
  "paper-green", "paper-orange"
];
const paperStyles = ["tape", "clip", "pin", "torn"];
const rotations = ["-2deg", "1.5deg", "-1deg", "2deg", "0.5deg"];

let tasks = [];
let currentFilter = "all";
let searchText = "";
let loading = false;
let busy = false;
let loadVersion = 0;

const taskMessage = document.createElement("p");
taskMessage.setAttribute("role", "status");
taskForm.after(taskMessage);

function showError(error) {
  taskMessage.textContent = error.message || "Something went wrong.";
}

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function formatDate(date) {
  if (!date) return "No due date";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

async function loadTasks() {
  const version = ++loadVersion;
  const userId = currentUser?.id;
  tasks = [];
  loading = !!userId;
  taskMessage.textContent = userId ? "Loading notes..." : "";
  renderTasks();

  if (!userId) return;

  try {
    const { data, error } = await supabaseClient
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (version !== loadVersion || currentUser?.id !== userId) return;
    if (error) throw error;
    tasks = data;
    taskMessage.textContent = "";
  } catch (error) {
    if (version === loadVersion) showError(error);
  } finally {
    if (version === loadVersion) {
      loading = false;
      renderTasks();
    }
  }
}

function getFilteredTasks() {
  return tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesFilter =
      currentFilter === "all" ||
      (currentFilter === "completed" && task.completed) ||
      (currentFilter === "pending" && !task.completed);
    return matchesSearch && matchesFilter;
  });
}

async function mutateTask(operation) {
  if (busy || !currentUser) return;
  busy = true;
  const submitButton = taskForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  taskMessage.textContent = "";

  try {
    await operation(currentUser.id);
  } catch (error) {
    showError(error);
  } finally {
    busy = false;
    submitButton.disabled = false;
    renderTasks();
  }
}

function renderTasks() {
  if (busy) return;
  const filteredTasks = getFilteredTasks();
  taskList.replaceChildren();
  emptyState.classList.toggle(
    "hidden", loading || !currentUser || filteredTasks.length > 0
  );

  filteredTasks.forEach(task => {
    const note = document.createElement("article");
    const color = paperColors.includes(task.color)
      ? task.color : "paper-yellow";
    const style = paperStyles.includes(task.style) ? task.style : "tape";
    note.className = `sticky-note ${color} ${style}`;
    note.classList.toggle("completed", task.completed);
    note.style.setProperty("--rotate", task.rotate || "0deg");

    note.innerHTML = `
      <h2 class="note-title"></h2>
      <div class="note-meta">
        <span class="badge priority-badge"></span>
        <span class="badge date-badge"></span>
      </div>
      <div class="note-actions">
        <button type="button" class="done-btn"></button>
        <button type="button" class="delete-btn">Delete</button>
      </div>
    `;

    note.querySelector(".note-title").textContent = task.title;
    const priorityBadge = note.querySelector(".priority-badge");
    priorityBadge.textContent = task.priority;
    if (["low", "medium", "high"].includes(task.priority)) {
      priorityBadge.classList.add(task.priority);
    }
    note.querySelector(".date-badge").textContent = formatDate(task.due_date);
    const doneButton = note.querySelector(".done-btn");
    doneButton.textContent = task.completed ? "Undo" : "Done";

    doneButton.addEventListener("click", () => {
      mutateTask(async userId => {
        const { data, error } = await supabaseClient
          .from("tasks")
          .update({ completed: !task.completed })
          .eq("id", task.id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) throw error;
        if (currentUser?.id !== userId) return;
        tasks = tasks.map(item => item.id === task.id ? data : item);
      });
    });

    note.querySelector(".delete-btn").addEventListener("click", () => {
      mutateTask(async userId => {
        const { data, error } = await supabaseClient
          .from("tasks")
          .delete()
          .eq("id", task.id)
          .eq("user_id", userId)
          .select("id")
          .single();

        if (error) throw error;
        if (currentUser?.id !== userId) return;
        note.classList.add("falling");
        await new Promise(resolve => setTimeout(resolve, 850));
        if (currentUser?.id !== userId) return;
        tasks = tasks.filter(item => item.id !== data.id);
      });
    });

    taskList.appendChild(note);
  });
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title || loading) return;

  mutateTask(async userId => {
    const { data, error } = await supabaseClient
      .from("tasks")
      .insert({
        user_id: userId,
        title,
        priority: priorityInput.value,
        due_date: dateInput.value || null,
        completed: false,
        color: getRandomItem(paperColors),
        style: getRandomItem(paperStyles),
        rotate: getRandomItem(rotations)
      })
      .select()
      .single();

    if (error) throw error;
    if (currentUser?.id !== userId) return;
    tasks.unshift(data);
    taskForm.reset();
    priorityInput.value = "medium";
  });
});

searchInput.addEventListener("input", event => {
  searchText = event.target.value;
  renderTasks();
});

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach(item => {
      item.classList.toggle("active", item === button);
    });
    renderTasks();
  });
});

renderTasks();