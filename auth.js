const authSection = document.querySelector("#authSection");
const appSection = document.querySelector("#appSection");
const emailInput = document.querySelector("#emailInput");
const passwordInput = document.querySelector("#passwordInput");
const signupBtn = document.querySelector("#signupBtn");
const loginBtn = document.querySelector("#loginBtn");
const logoutBtn = document.querySelector("#logoutBtn");
const authMessage = document.querySelector("#authMessage");

let currentUser = JSON.parse(localStorage.getItem("current-user")) || null;

function updateAuthUI() {
  if (currentUser) {
    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");

    if (typeof loadTasks === "function") {
      loadTasks();
      renderTasks();
    }
  } else {
    authSection.classList.remove("hidden");
    appSection.classList.add("hidden");
  }
}

signupBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    authMessage.textContent = "Please enter email and password.";
    return;
  }

  const users = JSON.parse(localStorage.getItem("todo-users")) || [];

  const userExists = users.some((user) => user.email === email);

  if (userExists) {
    authMessage.textContent = "User already exists. Please login.";
    return;
  }

  users.push({ email, password });
  localStorage.setItem("todo-users", JSON.stringify(users));

  authMessage.textContent = "Signup successful. Now login.";
});

loginBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  const users = JSON.parse(localStorage.getItem("todo-users")) || [];

  const user = users.find((item) => item.email === email && item.password === password);

  if (!user) {
    authMessage.textContent = "Invalid email or password.";
    return;
  }

  currentUser = { email };
  localStorage.setItem("current-user", JSON.stringify(currentUser));
  updateAuthUI();
});

logoutBtn.addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem("current-user");
  updateAuthUI();
});

updateAuthUI();