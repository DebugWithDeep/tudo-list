const authSection = document.querySelector("#authSection");
const appSection = document.querySelector("#appSection");
const emailInput = document.querySelector("#emailInput");
const passwordInput = document.querySelector("#passwordInput");
const signupBtn = document.querySelector("#signupBtn");
const loginBtn = document.querySelector("#loginBtn");
const logoutBtn = document.querySelector("#logoutBtn");
const authMessage = document.querySelector("#authMessage");

let currentUser = null;

async function updateAuthUI() {
  authSection.classList.toggle("hidden", !!currentUser);
  appSection.classList.toggle("hidden", !currentUser);
  if (typeof loadTasks === "function") await loadTasks();
}

async function authenticate(mode) {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!emailInput.checkValidity() || !email || !password) {
    authMessage.textContent = "Enter a valid email and password.";
    return;
  }
  loginBtn.disabled = signupBtn.disabled = true;
  authMessage.textContent = "Please wait...";
  try {
    const credentials = { email, password };
    const result = mode === "signup"
      ? await supabaseClient.auth.signUp({
    ...credentials,
    options: {
      emailRedirectTo: window.location.origin + window.location.pathname
    }
  })
      : await supabaseClient.auth.signInWithPassword(credentials);
    if (result.error) throw result.error;
    passwordInput.value = "";
    authMessage.textContent = result.data.session
      ? ""
      : "Check your email to confirm your account, then log in.";
  } catch (error) {
    authMessage.textContent = error.message;
  } finally {
    loginBtn.disabled = signupBtn.disabled = false;
  }
}

signupBtn.addEventListener("click", () => authenticate("signup"));
loginBtn.addEventListener("click", () => authenticate("login"));
logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  } catch (error) {
    alert(error.message);
  } finally {
    logoutBtn.disabled = false;
  }
});

supabaseClient.auth.onAuthStateChange((event, session) => {
  currentUser = session?.user ?? null;
  setTimeout(() => {
    updateAuthUI().catch(error => {
      authMessage.textContent = error.message;
    });
  }, 0);
});