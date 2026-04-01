function renderTopbarProfile(user) {
  const resolvedEmail =
    (user && user.email)
    || localStorage.getItem("currentUserEmail")
    || "Guest";
  const initials = resolvedEmail.charAt(0).toUpperCase();

  document.querySelectorAll("[data-topbar-email]").forEach(node => {
    node.innerText = resolvedEmail;
  });

  document.querySelectorAll("[data-topbar-avatar]").forEach(node => {
    node.innerText = initials;
  });
}

function redirectToDashboardIfLoggedIn() {
  firebase.auth().onAuthStateChanged(user => {
    renderTopbarProfile(user);

    if (user) {
      localStorage.setItem("currentUserEmail", user.email || "");
      window.location.href = "dashboard.html";
    }
  });
}

function protectPage() {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      localStorage.setItem("currentUserEmail", user.email || "");
      renderTopbarProfile(user);
      return;
    }

    window.location.href = "login.html";
  });
}
